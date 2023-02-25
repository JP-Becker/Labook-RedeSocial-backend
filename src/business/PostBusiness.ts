import { db } from "../database/Knex"
import { PostDatabase } from "../database/PostDatabase"
import { UserDatabase } from "../database/UserDatabase"
import { PostDB, ROLE_USER } from "../types"
import { BadRequestError } from "../errors/BadRequestError"
import { Post } from "../models/Post"
import { PostDTO, InsertInputPostDTO,UpdateInputDTO, LikeDislikeDTO, GetAllPostsInputDTO, DeleteInputPostDTO } from "../dtos/PostDTO"
import { IdGenerator } from "../services/IdGenerator"
import { TokenManager } from "../services/TokenManager"

export class PostBusiness {
    constructor(
        private postDatabase: PostDatabase,
        private userDatabase: UserDatabase,
        private postDTO: PostDTO,
        private idGenerator: IdGenerator,
        private tokenManager: TokenManager
    ){}

    public getPosts = async (input:GetAllPostsInputDTO)=>{
        const {q, token} = input

        if(typeof token !== "string"){
            throw new BadRequestError("'Token' não informado!")
        }

        const payload = this.tokenManager.getPayload(token)

        if (payload === null){
            throw new BadRequestError("'Token' não válido!")
        }
            
        const {
            postsDB,
            creatorsDB,
        } = await this.postDatabase.getPostsWithCreator()

        const posts = postsDB.map((postDB)=>{
            const post = new Post (
                postDB.id,
                postDB.content,
                postDB.likes,
                postDB.dislikes,
                postDB.created_at,
                postDB.updated_at,
                getCreator(postDB.creator_id)
                )

                return post.toBusinessModel()
        })

        function getCreator(creatorId: string){
            const creator = creatorsDB.find((creatorDB)=>{
                return creatorDB.id === creatorId
            })

            return{
                id: creator.id,
                name: creator.name
            }
        }

        return posts  
    }

    public insertNewPost = async(input:InsertInputPostDTO)=>{

        const {content, token} = input

        if(typeof token !== "string"){
            throw new BadRequestError("'Token' não informado!")
        }

        const payload = this.tokenManager.getPayload(token)

        if (payload === null){
            throw new BadRequestError("'Token' não válido!")
        }

        const id = this.idGenerator.generate()
        const created_at = (new Date()).toISOString()
        const updated_at = (new Date()).toISOString()
        const likes = 0
        const dislikes = 0
        const creator_id = payload.id

        if (content !== undefined){
            if(typeof content !== "string"){
                throw new BadRequestError("'content' precisa ser uma string")
            }
        }else{
            throw new BadRequestError("Favor, informar o 'content'")
        }

        const newPost = new Post (
            id,
            content,
            likes,
            dislikes,
            created_at,
            updated_at,
            {id:creator_id,
            name: payload.name,}
            )
        
        const newPostDB = newPost.toDBModel()
        await this.postDatabase.insertNewPost(newPostDB)

        const output = {
            message: "Publicação realizada com sucesso",
            post: newPost,
        }

        return output
    }

    public updatePost = async (input:UpdateInputDTO)=>{
        const {id,content,token} = input

        if(typeof token !== "string"){
            throw new BadRequestError("'Token' não informado!")
        }

        const payload = this.tokenManager.getPayload(token)

        if (payload === null){
            throw new BadRequestError("'Token' não válido!")
        }

        const filterPostToUpdate = await this.postDatabase.getPostById(id)

        if(!filterPostToUpdate){
            throw new BadRequestError("'Id' não localizada")
        }

        if(payload.role !== ROLE_USER.ADMIN){
            if(filterPostToUpdate.creator_id !== payload.id){
                throw new BadRequestError("Você não possui autorização para editar esta publicação.")
            }
        }

        if (content !== undefined){
            if(typeof content !== "string"){
                throw new BadRequestError("'content' precisa ser uma string")
            }
        }else{
            throw new BadRequestError("Favor, informar o 'content'")
        }

        const updateAt = (new Date()).toISOString()

        const postToUpdate = new Post(
            id,
            content,
            filterPostToUpdate.likes,
            filterPostToUpdate.dislikes,
            filterPostToUpdate.created_at,
            updateAt,
            {
                id:filterPostToUpdate.creator_id,
                name: payload.name
            }
        )

        const postToUpdateDB = postToUpdate.toDBModel()
        await this.postDatabase.updatePost(postToUpdateDB,id)

        const output = {
            message: "Atualização realizada com sucesso",
            post: postToUpdate,
        }

        return output
    }


    public deletePost = async (input:DeleteInputPostDTO )=>{

        const {id, token} = input

        if(typeof token !== "string"){
            throw new BadRequestError("'Token' não informado!")
        }

        const payload = this.tokenManager.getPayload(token)

        if (payload === null){
            throw new BadRequestError("'Token' não válido!")
        }

        const filterPostToDelete = await this.postDatabase.getPostById(id)
        const filterUserDB = await this.userDatabase.getUserById(filterPostToDelete.creator_id)

        if(filterUserDB.role !== ROLE_USER.ADMIN){
            if(filterUserDB.id !== payload.id){
                throw new BadRequestError("Você não possui autorização para realizar esta operação")
            }
        }
    
        if(filterPostToDelete){
            await this.postDatabase.deletePostbyId(id)
            const output = {
                message: "Publicação excluida com sucesso",
                post: filterPostToDelete}
            return output
        }else{
            throw new BadRequestError("Publicação não encontrada")
        }
    }

    public likeDislike = async (input: LikeDislikeDTO)=>{
        const {id, like, token} = input

        if(typeof token !== "string"){
            throw new BadRequestError("'Token' não informado!")
        }

        const payload = this.tokenManager.getPayload(token)

        if (payload === null){
            throw new BadRequestError("'Token' não válido!")
        }

        const filterPostToLike = await this.postDatabase.getPostById(id)
        const filterIdLD = await this.postDatabase.likeDislike(payload.id, id)

        if(filterIdLD){
            throw new BadRequestError("Você já interagiu com esta publicação")
        }

        if(!filterPostToLike){
            throw new BadRequestError("Publicação não encontrada")
        }

        const updateAt = (new Date()).toISOString()
        let likes = 0
        let dislikes = 0

        if(like === 0){
            dislikes = 1
            
        }else if(like === 1){
            likes = 1
        }else{
            throw new BadRequestError("Informe um número válido. (1) like, (0) dislike")
        }

        const postToLike = new Post(
            id,
            filterPostToLike.content,
            likes,
            dislikes,
            filterPostToLike.created_at,
            updateAt,
            {id: filterPostToLike.creator_id,
            name: ""}
        )

        const updateLikeDB = {
            user_id: payload.id,
            post_id: id,
            like: 1
        } 

        const postToLikeDB = postToLike.toDBModel()
        await this.postDatabase.updatePost(postToLikeDB,id)
        await this.postDatabase.updateLikeDislike(updateLikeDB)

        if(like === 0){
            const output = {
                message: "'Dislike' realizado com sucesso!", 
                post: postToLikeDB}
            return output
        }else if(like===1){
            const output = {
                message: "'Like' realizado com sucesso!", 
                post: postToLikeDB}
            return output
        }

    }
}