import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createTodo } from '../../helpers/todos'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    
    const newTodo: CreateTodoRequest = JSON.parse(event.body)

    //validate newTodo fields
    if(!newTodo.name || !newTodo.dueDate || newTodo.name.trim().length < 2 || newTodo.dueDate.trim().length < 2) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          message: 'Name of todo item is required and must be at least 2 characters long',
          error: 'Todo name is required and must be at least 2 characters'
        })
      }
    }


    const userId = getUserId(event)
    const item = await createTodo(userId, newTodo)
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        item
      })
    }
  }
    //return undefined
)

handler.use(
  cors({
    credentials: true
  })
)
