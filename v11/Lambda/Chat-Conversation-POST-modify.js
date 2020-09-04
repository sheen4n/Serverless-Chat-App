const AWS = require('aws-sdk');
const uuidV4 = require('uuid/v4');
const dynamo = new AWS.DynamoDB();

exports.handler = async (event) => {
  const id = uuidV4();
  const { users: otherUsers, cognitoUsername } = event.users;

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
