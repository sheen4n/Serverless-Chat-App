const AWS = require('aws-sdk');
const { uuid } = require('uuidv4');
const dynamo = new AWS.DynamoDB();

exports.handler = async (event) => {
  const id = uuid();
  console.log(id, event.users, event.cognitoUsername);

  const { users: otherUsers, cognitoUsername } = event;

  const participants = [...otherUsers, cognitoUsername];

  const recordsToPut = participants.map((participant) => ({
    PutRequest: {
      Item: {
        ConversationId: {
          S: id,
        },
        Username: {
          S: participant,
        },
      },
    },
  }));

  await dynamo
    .batchWriteItem({
      RequestItems: {
        'Chat-Conversations': recordsToPut,
      },
    })
    .promise();

  return id;
};
