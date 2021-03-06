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
import requestConstraints from '../../constraints/list/get.constraint.json';
// Enums
import { StatusCode } from '../../enums/status-code.enum';
import { ResponseMessage } from '../../enums/response-message.enum';

export const getList: APIGatewayProxyHandler = (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  // console.log(event.queryStringParameters);
  // Initialize response variable
  let response;

  // Parse request parameters
  const requestData = JSON.parse(event.body);

  // Initialise database service
  const databaseService = new DatabaseService();

  // Destructure request data
  const { listId } = requestData;

  // Destructure process.env
  const { LIST_TABLE, TASKS_TABLE } = process.env;

  // Validate against constraints
  return validateAgainstConstraints(requestData, requestConstraints)
    .then(() => {
      // Get item from the DynamoDB table
      return databaseService.getItem({ key: listId, tableName: LIST_TABLE });
    })
    .then(async (data) => {
      // Initialise DynamoDB QUERY parameters
      const params = {
        TableName: TASKS_TABLE,
        IndexName: 'list_index',
        KeyConditionExpression: 'listId = :listIdVal',
        ExpressionAttributeValues: {
          ':listIdVal': listId,
        },
      };

      // Query table for tasks with the listId
      const results = await databaseService.query(params);
      const tasks = results?.Items?.map((task) => {
        return {
          id: task.id,
          description: task.description,
          completed: task.completed,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        };
      });

      // Set Success Response with data
      response = new ResponseModel(
        {
          ...data.Item,
          taskCount: tasks?.length,
          tasks,
        },
        StatusCode.OK,
        ResponseMessage.GET_LIST_SUCCESS
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
              ResponseMessage.GET_LIST_FAIL
            );
    })
    .then(() => {
      // Return API Response
      return response.generate();
    });
};
