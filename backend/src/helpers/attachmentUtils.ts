import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
//import { loggers } from 'winston'
import { createLogger } from '../utils/logger'
import { TodosAccess } from './todosAcess'

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('Attachment')

// TODO: Implement the fileStogare logic
const todosAccess = new TodosAccess()

export class AttachmentUtils {
    constructor(
        private readonly s3: AWS.S3 = new XAWS.S3({ signatureVersion: 'v4' }),
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION) {
    }
    
    async generateUploadUrl(userId: string, todoId: string): Promise<string> {
        console.log('Generating upload url', { todoId }, { userId })
        const returnobj = this.s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: todoId,
            Expires: parseInt(this.urlExpiration)
        })

        logger.debug('Generated upload url obj: ', { returnobj })
        let attachment_url = await this.getAttachmentUrl(todoId)
        this.updateAttachmentUrl(userId, todoId, attachment_url)
        console.log('Finished updating attachment url', { attachment_url })
        return returnobj;
    }

    async getAttachmentUrl(attachmentId: string): Promise<string> {
        return `https://${this.bucketName}.s3.amazonaws.com/${attachmentId}`
    }

    async updateAttachmentUrl(userId: string, todoId: string, attachmentUrl: string): Promise<string> {
        logger.debug('Updating attachment url', { todoId }, { userId }, { attachmentUrl })
        try {
            await todosAccess.updateTodoAttachmentUrl(userId, todoId, attachmentUrl)
        
            logger.info(
              'AttachmentURL updated successfully',{
                userId,
                todoId
              }
            )
            return
          } catch (error) {
            logger.error(error)
            throw new Error('AttachmentURL update failed')
          }
    }
}

