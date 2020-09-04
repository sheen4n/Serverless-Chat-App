const AWS = require('aws-sdk');

const S3 = new AWS.S3();

const bucket = 'sheen-serverless-chat';
const dynamo = new AWS.DynamoDB();

exports.handler = async (event) => {
  const path = event.pathParameters.proxy;
  let key;
  let result;

  if (path === 'conversations') {
    key = 'data/conversations.json';
    const S3params = {
      Bucket: bucket,
      Key: key,
    };
    const s3Data = await S3.getObject(S3params).promise();
    result = JSON.parse(s3Data.Body.toString('utf-8'));
  } else if (path.startsWith('conversations/')) {
    const id = path.substring('conversations/'.length);
    const messagesData = await dynamo
      .query({
        TableName: 'Chat-Messages',
        ProjectionExpression: '#T, Sender, Message',
        ExpressionAttributeNames: { '#T': 'Timestamp' },
        KeyConditionExpression: 'ConversationId = :id',
        ExpressionAttributeValues: { ':id': { S: id } },
      })
      .promise();

    const messages = messagesData.Items.map((message) => ({
      sender: message.Sender.S,
      time: Number(message.Timestamp.N),
      message: message.Message.S,
    }));

    const conversationDetailsData = await dynamo
      .query({
        TableName: 'Chat-Conversations',
        Select: 'ALL_ATTRIBUTES',
        KeyConditionExpression: 'ConversationId = :id',
        ExpressionAttributeValues: { ':id': { S: id } },
      })
      .promise();

    const participants = conversationDetailsData.Items.map((item) => item.Username.S);

    result = {
      id,
      participants,
      last: messages.length > 0 ? messages[messages.length - 1].time : undefined,
      messages,
    };
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify('Route Not Found'),
    };
  }

  // TODO implement
  const response = {
    statusCode: 200,
    body: JSON.stringify(result),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  };
  return response;
};
