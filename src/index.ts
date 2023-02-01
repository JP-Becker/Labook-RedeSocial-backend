import express, { Request, Response } from 'express'
import cors from 'cors'
import { db } from './database/knex'
import { TUserDB, TTasksDB, TUserTaskDB, TTasksWithUsersDB } from './types'

const app = express()

app.use(cors())
app.use(express.json())

app.listen(3003, () => {
    console.log(`Servidor rodando na porta ${3003}`)
})

app.get("/ping", async (req: Request, res: Response) => {
    try {
				const result = await db("users")
        res.status(200).send({ message: "Pong!", result })
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
});


// ------------------------------------------------------------------------------------------------
// USERS ENDPOINTS
// get all users
app.get('/users', async (req: Request, res: Response) => {
    try {
        const result = await db("users")
        res.status(200).send({ 'Lista de usuários cadastrados': result})
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})


// search user by name via query params
app.get('/users/search', async (req: Request, res: Response) => {
    try {
        const q = req.query.q as string

        if (q.length > 0) {
            const searchedProduct = await db("users").where("name", "LIKE", `%${q}%`)
            res.status(200).send({"Resultado(s) da sua busca": searchedProduct})
        } else {
            res.status(400)
            throw new Error("Você deve digitar algo no campo de busca!");
        }

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})


// search user by ID via path params
app.get('/users/:id', async (req: Request, res: Response) => {
    try {
        const searchedId = req.params.id

        const [result] = await db("users").where({ id: searchedId })
        
        if (result) {
            res.status(200).send({"Resultado da sua busca" : result})
        } else {
            res.status(404)
            throw new Error("A 'id' buscada não existe no banco de dados");
        }

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})


// create a new user
app.post('/users', async (req: Request, res: Response) => {
    try {
        const { id, name, email, password } = req.body

        if (typeof id !== "string") {
            res.status(400)
            throw new Error("Tipo de 'id' inválido");
        }
        if (id.length < 4) {
            res.status(400)
            throw new Error("'id' deve possuir pelo menos 4 caracteres")
        }
        if (typeof name !== "string") {
            res.status(400)
            throw new Error("Tipo de 'name' inválido");
        }
        if (name.length < 4) {
            res.status(400)
            throw new Error("'name' deve possuir pelo menos 4 caracteres");
        }
        if (typeof email !== "string") {
            res.status(400)
            throw new Error("Tipo de 'email' inválido");
        }
        if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,12}$/g)) {
			throw new Error("'password' deve possuir entre 8 e 12 caracteres, com letras maiúsculas e minúsculas e no mínimo um número e um caractere especial")
		}

        const [userIdAlreadyExists] : TUserDB[] | undefined[] = await db("users").where({id})

        if (userIdAlreadyExists) {
            res.status(400)
            throw new Error("Essa 'id' já existe");
        }

        const [userEmailAlreadyExists] : TUserDB[] | undefined[] = await db("users").where({email})

        if (userEmailAlreadyExists) {
            res.status(400)
            throw new Error("Esse 'email' já existe");
        }
        
        const newUser: TUserDB = {
            id,
            name,
            email,
            password
        }
        
        await db("users").insert(newUser)

        res.status(201).send({
            message: "User criado com sucesso",
            user: newUser
        })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})


// delete user by ID
app.delete('/users/:id', async (req: Request, res: Response) => {
    try {
        const idToDelete = req.params.id

        if (idToDelete[0] !== "f") {
            res.status(404)
            throw new Error("'id' deve iniciar com a letra 'f'")
        }

        const [userIdAlreadyExists] : TUserDB[] | undefined[] = await db("users").where({id: idToDelete})

        if (!userIdAlreadyExists) {
            res.status(404)
            throw new Error("Essa 'id' não existe")
        }

        await db("users").del().where({ id: idToDelete})
        res.status(200).send({ message: "User deletado com sucesso" })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})


// ------------------------------------------------------------------------------------------------
// TASKS ENDPOINTS
// get all tasks
app.get('/tasks', async (req: Request, res: Response) => {
    try {
        const result = await db("tasks")
        res.status(200).send({ 'Lista de tarefas cadastradas': result})
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})


// get task by id
app.get('/tasks/:id', async (req: Request, res: Response) => {
    try {
        const searchedId = req.params.id

        const [result] = await db("tasks").where({ id: searchedId })
        
        if (result) {
            res.status(200).send({"Resultado da sua busca" : result})
        } else {
            res.status(404)
            throw new Error("A 'id' da tarefa buscada não existe no banco de dados");
        }

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})


// create a new task
app.post('/tasks', async (req: Request, res: Response) => {
    try {
        const { id, title, description } = req.body

        if (typeof id !== "string") {
            res.status(400)
            throw new Error("Tipo de 'id' inválido");
        }
        if (id.length < 4) {
            res.status(400)
            throw new Error("'id' deve possuir pelo menos 4 caracteres")
        }
        if (id[0] !== "t") {
            res.status(400)
            throw new Error("'id' deve começar com a letra 't'")
        }
        if (typeof title !== "string") {
            res.status(400)
            throw new Error("Tipo de 'title' inválido");
        }
        if (title.length < 1) {
            res.status(400)
            throw new Error("'title' é obrigatório");
        }
        if (typeof description !== "string") {
            res.status(400)
            throw new Error("Tipo de 'description' inválido");
        }
        if (description.length < 1) {
            res.status(400)
            throw new Error("'description' é obrigatório");
        }

        const [taskIdAlreadyExists] : TTasksDB[] | undefined[] = await db("tasks").where({id})

        if (taskIdAlreadyExists) {
            res.status(400)
            throw new Error("Essa 'id' já existe");
        }
        
        const newTask = {
            id,
            title,
            description,
        }
        
        await db("tasks").insert(newTask)

        res.status(201).send({
            message: "Task criada com sucesso",
            task: newTask
        })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})


// edit task by id
app.put('/tasks/:id', async (req: Request, res: Response) => {
    try {
        const paramsId = req.params.id

        const newId = req.body.id
        const newTitle = req.body.title
        const newDescription = req.body.description
        const newCreated_at = req.body.created_at
        const newStatus = req.body.status
        
        if (newId !== undefined) {
            if (typeof newId !== "string") {
                res.status(400)
                throw new Error("'id' deve ser string")
            }
    
            if (newId.length < 4) {
                res.status(400)
                throw new Error("'id' deve possuir pelo menos 4 caracteres")
            }
        }
        if (newTitle !== undefined) {
            if (typeof newTitle !== "string") {
                res.status(400)
                throw new Error("'title' deve ser string")
            }
            if (newTitle.length < 2) {
                res.status(400)
                throw new Error("'title' deve possuir ao menos 2 caracteres")
            }
        }
        if (newDescription !== undefined) {
            if (typeof newDescription !== "string") {
                res.status(400)
                throw new Error("'description' deve ser string")
            }
        }
        if (newCreated_at !== undefined) {
            if (typeof newCreated_at !== "string") {
                res.status(400)
                throw new Error("'created_at' deve ser string")
            }
        }
        if (newStatus !== undefined) {
            if (typeof newStatus !== "number") {
                res.status(400)
                throw new Error("'status' deve ser number (0 para incompleta ou 1 para completa)")
            }
        }

        const [ selectedTask ]: TTasksDB[] | undefined[] = await db("tasks").where({ id: paramsId })

        if (!selectedTask) {
            res.status(404)
            throw new Error("Essa 'id' não existe no banco de dados");
        }

        const editedTask: TTasksDB = {
            id: newId || selectedTask.id,
            title: newTitle || selectedTask.title,
            description: newDescription || selectedTask.description,
            created_at: newCreated_at || selectedTask.created_at,
            status: isNaN(newStatus) ? selectedTask.status : newStatus
        }

        await db("tasks").update(editedTask).where({ id: paramsId })

        res.status(200).send({
            message: "Task editada com sucesso!",
            task: editedTask
        })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})


// delete task by id
app.delete('/tasks/:id', async (req: Request, res: Response) => {
    try {
        const idToDelete = req.params.id

        if (idToDelete[0] !== "t") {
            res.status(404)
            throw new Error("'id' deve iniciar com a letra 't'")
        }

        const [taskIdAlreadyExists] : TTasksDB[] | undefined[] = await db("tasks").where({id: idToDelete})

        if (!taskIdAlreadyExists) {
            res.status(404)
            throw new Error("Essa 'id' não existe")
        }

        await db("users_tasks").del().where({ task_id: idToDelete })
        await db("tasks").del().where({ id: idToDelete})
        
        res.status(200).send({ message: "Task deletada com sucesso" })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})


// ------------------------------------------------------------------------------------------------
// USERS_TASKS ENDPOINTS
// assign task to user by ID
app.post("/tasks/:taskId/users/:userId", async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId
        const taskId = req.params.taskId

        if (userId[0] !== "f") {
            res.status(400)
            throw new Error("'userId' deve começar com a letra f");
        }
        if (taskId[0] !== "t") {
            res.status(400)
            throw new Error("'taskId' deve começar com a letra t");
        }

        const [user]: TUserDB[] | undefined[] = await db("users").where({id: userId})
        const [task]: TTasksDB[] | undefined[] = await db("tasks").where({id: taskId})

        if (!user) {
            res.status(400)
            throw new Error("'userId' não encontrado")
        }
        if (!task) {
            res.status(400)
            throw new Error("'taskId' não encontrado")
        }

        const newUserTask: TUserTaskDB = {
            task_id: taskId,
            user_id: userId
        }

        res.status(201).send({message: `Task designada ao usuário de id '${userId}'`})

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})


// remove task assigned to user by ID
app.delete("/tasks/:taskId/users/:userId", async (req: Request, res: Response) => {
    try {
        const userIdToDelete = req.params.userIdToDelete
        const taskIdToDelete = req.params.taskIdToDelete

        if (userIdToDelete[0] !== "f") {
            res.status(400)
            throw new Error("'userIdToDelete' deve começar com a letra f");
        }
        if (taskIdToDelete[0] !== "t") {
            res.status(400)
            throw new Error("'taskIdToDelete' deve começar com a letra t");
        }

        const [user]: TUserDB[] | undefined[] = await db("users").where({id: userIdToDelete})
        const [task]: TTasksDB[] | undefined[] = await db("tasks").where({id: taskIdToDelete})

        if (!user) {
            res.status(400)
            throw new Error("'id' de usuário não encontrado")
        }
        if (!task) {
            res.status(400)
            throw new Error("'task' de usuário não encontrado")
        }

        await db("users_tasks").del()
            .where({task_id: taskIdToDelete})
            .andWhere({user_id: userIdToDelete})

        res.status(201).send({message: `Task de id '${taskIdToDelete}' removida do usuário de id '${userIdToDelete}'`})

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})


// get all tasks and their responsibles
app.get("/tasks/users", async (req: Request, res: Response) => {
    try {
        const result = await db("users_tasks")

        res.status(200).send(result)

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})