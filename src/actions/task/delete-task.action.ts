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
import requestConstraints from '../../constraints/task/delete.contstraint.json';

export const deleteTask: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  // Initialize response variable
  let response;

  // Parse request parameters
  const requestData = JSON.parse(event.body);

  // Initialise database service
  const databaseService = new DatabaseService();

  // Destructure request data
  const { taskId, listId } = requestData;

  // Destructure process.env
  const { TASKS_TABLE } = process.env;

  // Validate against constraints
  return validateAgainstConstraints(requestData, requestConstraints)
    .then(() => {
      // Get item from the DynamoDB table
      // if it exists
      return databaseService.getItem({
        key: taskId,
        hash: 'listId',
        hashValue: listId,
        tableName: TASKS_TABLE,
      });
    })
    .then(() => {
      // Initialise DynamoDB DELETE parameters
      const params = {
        TableName: TASKS_TABLE,
        Key: {
          id: taskId,
          listId,
        },
      };
      // Delete task from db
      return databaseService.delete(params);
    })
    .then(() => {
      // Set Success Response
      response = new ResponseModel({}, 200, 'Task successfully deleted');
    })
    .catch((error) => {
      // Set Error Response
      response =
        error instanceof ResponseModel
          ? error
          : new ResponseModel({}, 500, 'Task could not be deleted');
    })
    .then(() => {
      // Return API Response
      return response.generate();
    });
};
