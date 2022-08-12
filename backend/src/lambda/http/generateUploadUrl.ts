import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { AttachmentUtils } from '../../helpers/attachmentUtils'
import { getUserId } from '../utils'

const attachmentUtils = new AttachmentUtils();

import { createLogger } from '../../utils/logger'
const logger = createLogger('GenerateUploadUrl')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    logger.debug(`At generate upload url event`,{event})
    const userId = getUserId(event)
    const url = await attachmentUtils.generateUploadUrl( userId, todoId )
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        uploadUrl: url
      })
    }
   // return undefined
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
