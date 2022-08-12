import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

const jwt1 = require( 'jsonwebtoken' );

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-51scbvhf.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  logger.info('JWT INFO:', {
    header: jwt.header,
    payload: jwt.payload
  })
  //Retrieve the JWKS from the JWKs endpoint.
  const response = await Axios.get(jwksUrl)
  const jwks1 = response.data.keys
  logger.info('JWKS Keys', {
    jwks1
  })

  const signingKeys = jwks1
  .filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signature verification
              && key.kty === 'RSA' // We are only supporting RSA (RS256)
              && key.kid           // The `kid` must be present to be useful for later
              && ((key.x5c && key.x5c.length) || (key.n && key.e)) // Has useful public keys
  ).map(key => {
    return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) };
  });

  //Decode the JWT and grab the kid property from the header.
  const kid = jwt.header.kid

  const signingKey = signingKeys.find(key => key.kid === kid);


  if (!signingKey) {
    throw new Error('Invalid signing key')
  }

  logger.info('Signing Key', {
    kid: signingKey.kid,
    nbf: signingKey.nbf,
    publicKey: signingKey.publicKey
  })

  //Verify the JWT and get the payload.
  const actualKey = signingKey.publicKey || signingKey.rsaPublicKey;

  logger.info('Actual Key', {
    actualKey
  })

  return new Promise( ( resolve, reject ) => {
    jwt1.verify( token, actualKey, { algorithms: [ 'RS256' ] }, ( err, decoded ) => {
      if ( err ) {
        reject( new Error( err ) );
      } else {
        resolve( decoded );
      }
    } );
  } );

  // const jwks = jwks1.filter(key => key.use === 'sig' && key.kty === 'RSA' && key.kid === jwt.header.kid)[0]

  // logger.info('JWKS Keys2', {
  //   jwks
  // })

  // const jwks2 = jwks1.map(jwk => {
  //   return {
  //     kty: jwk.kty,
  //     kid: jwk.kid,
  //     use: jwk.use,
  //     n: jwk.n,
  //     e: jwk.e
  //   }
  // }).filter(jwk => jwk.use === 'sig' && jwk.kty === 'RSA' && jwk.kid === jwt.header.kid)

  // const jwk = jwks2[0]
  // if (!jwk) throw new Error('Invalid JWT token')
  // const publicKey = `-----BEGIN CERTIFICATE-----\n${jwk.n}\n-----END CERTIFICATE-----`
  // logger.info('Public Key:', {
  //   publicKey
  // })
  // return verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/

  //Retrieve the JWKS and filter for potential signature verification keys
  // const jwks = await Axios.get(jwksUrl)
  // logger.debug('JWKS:', { jwks })
  // const signingKeys = jwks.data.keys.filter(key => key.use === 'sig') //JWKS use property to determine if key is for signing
  // //const signingKeys = jwks.data.keys.filter(key => key.use === 'signing')
  // //Decode the JWT and grab the kid property from the header.
  // const kid = jwt.header.kid
  // //Find the signature verification key in the filtered JWKS with a matching kid property.
  // const signingKey = signingKeys.find(key => key.kid === kid)
  // //Using the x5c property build a certificate which will be used to verify the JWT signature.
  // const cert = signingKey.x5c[0]
  // //Verify the JWT signature using the certificate.
  // const verifiedToken = verify(token, cert, { algorithms: ['RS256'] })
  // //Return the decoded JWT payload.
  // return verifiedToken as JwtPayload

/*

  const response = await Axios.get(jwksUrl)
  const keys = response.data.keys
  const key = keys.find(k => k.kid === jwt.header.kid)
  const cert = key.x5c[0]
  const cert64 = cert.replace(/[-_]/g, '')
  const certBuffer = Buffer.from(cert64, 'base64')
  const certPublicKey = certBuffer.toString('ascii')
  const options = { algorithms: ['RS256'] }
  const verified = verify(token, certPublicKey, options) as JwtPayload
  return verified
  //return undefined
  */
}

function certToPEM( cert ) {
  let pem = cert.match( /.{1,64}/g ).join( '\n' );
  pem = `-----BEGIN CERTIFICATE-----\n${ cert }\n-----END CERTIFICATE-----\n`;
  return pem;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]
  logger.info('Token:', {
    token: token.substring(0, 5) + '...'
  })
  return token
}
