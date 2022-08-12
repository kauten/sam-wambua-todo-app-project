import { TodosAccess } from './todosAcess'
//import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
//import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
//import { parseUserId } from '../auth/utils'

// TODO: Implement businessLogic

const todosAccess = new TodosAccess()
//const attachmentUtils = new AttachmentUtils()

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
  return todosAccess.getAllTodos(userId)
}

export async function createTodo(userId: string, createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
    const todoId = uuid.v4()

    const todoItem: TodoItem = {
        todoId,
        userId,
        createdAt: new Date().toISOString(),
        name: createTodoRequest.name,
        dueDate: createTodoRequest.dueDate,
        done: false,
        //attachmentUrl: await attachmentUtils.getAttachmentUrl(todoId)
    }
    return todosAccess.createTodo(todoItem)
}

export async function updateTodo(userId: string, todoId: string, updateTodoRequest: UpdateTodoRequest): Promise<void> {
    return todosAccess.updateTodo(userId, todoId, updateTodoRequest)
}

export async function deleteTodo( userId: string, todoId: string): Promise<void> {
    return todosAccess.deleteTodo(userId, todoId)
}




