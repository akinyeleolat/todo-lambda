import {
  APIGatewayProxyHandler,
  APIGatewayEvent,
  Context,
  APIGatewayProxyResult,
} from 'aws-lambda';
import 'source-map-support/register';

// Models
import ResponseModel from '../../models/response.model';

// Services
import DatabaseService from '../../services/database.service';

// utils
import { validateAgainstConstraints } from '../../utils/util';

// Define the request constraints
import requestConstraints from '../../constraints/list/update.constraint.json';

// Enums
import { StatusCode } from '../../enums/status-code.enum';
import { ResponseMessage } from '../../enums/response-message.enum';

export const updateList: APIGatewayProxyHandler = (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  // Initialize response variable
  let response;

  // Parse request parameters
  const requestData = JSON.parse(event.body);

  // Initialise database service
  const databaseService = new DatabaseService();

  // Destructure environmental variable
  const { LIST_TABLE } = process.env;

  // Destructure request data
  const { listId, name } = requestData;

  // Validate against constraints
  return Promise.all([
    validateAgainstConstraints(requestData, requestConstraints),
    databaseService.getItem({ key: listId, tableName: LIST_TABLE }),
  ])
    .then(() => {
      // Initialise DynamoDB UPDATE parameters
      const params = {
        TableName: LIST_TABLE,
        Key: {
          id: listId,
        },
        UpdateExpression: 'set #name = :name, updatedAt = :timestamp',
        ExpressionAttributeNames: {
          '#name': 'name',
        },
        ExpressionAttributeValues: {
          ':name': name,
          ':timestamp': new Date().getTime(),
        },
        ReturnValues: 'UPDATED_NEW',
      };
      // Updates Item in DynamoDB table
      return databaseService.update(params);
    })
    .then((results) => {
      // Set Success Response
      response = new ResponseModel(
        { ...results.Attributes },
        StatusCode.OK,
        ResponseMessage.UPDATE_LIST_SUCCESS
      );
    })
    .catch((error) => {
      // Set Error Response
      response =
        error instanceof ResponseModel
          ? error
          : new ResponseModel(
              {},
              StatusCode.ERROR,
              ResponseMessage.UPDATE_LIST_FAIL
            );
    })
    .then(() => {
      // Return API Response
      return response.generate();
    });
};
