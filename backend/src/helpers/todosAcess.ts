import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
//import { parseUserId } from '../auth/utils'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly indexName = process.env.INDEX_NAME) {
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {

    const params = {
        TableName: this.todosTable,
        IndexName: this.indexName,
        KeyConditionExpression: 'userId = :userown',
        ExpressionAttributeValues: {
        ':userown': userId
        }
    }
    const result = await this.docClient.query({
        ...params
    }).promise()

    logger.info("result of table query", { result })

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    logger.info('Creating todo', { todoItem })
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem,

    }).promise()

    return todoItem
  }

  async updateTodo(userId: string, todoId: string, todoUpdate: TodoUpdate): Promise<void> {
    logger.info('Updating todo', { todoId, todoUpdate })
    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        userId,
        todoId,
        // userId: todoUpdate.userId
      },
      UpdateExpression: 'set #name = :name, #dueDate = :dueDate, #done = :done',
      ExpressionAttributeValues: {
        ':name': todoUpdate.name,
        ':dueDate': todoUpdate.dueDate,
        ':done': todoUpdate.done
      },
      ExpressionAttributeNames: {
        '#name': 'name',
        '#dueDate': 'dueDate',
        '#done': 'done'
      }
    }).promise()
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    logger.info('Deleting todo', { todoId })
    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        todoId: todoId.toString(),
        userId: userId.toString()
      }
    }).promise()
  }
  
  async updateTodoAttachmentUrl(userId: string, todoId: string, attachmentUrl: string): Promise<void> {
    logger.info('Updating todo attachment url', { todoId, attachmentUrl })
    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        userId,
        todoId,
        // userId: todoUpdate.userId
      },
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': attachmentUrl
      },
    }).promise()
  }

}
function createDynamoDBClient(): DocumentClient {
    return new XAWS.DynamoDB.DocumentClient()
}

