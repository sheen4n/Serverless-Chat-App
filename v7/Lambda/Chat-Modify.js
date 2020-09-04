const AWS = require('aws-sdk');

const dynamo = new AWS.DynamoDB();

exports.handler = async (event) => {
  const path = event.pathParameters.proxy;
  let result;

  if (path === 'conversations' && event.httpMethod === 'GET') {
    const conversationIdsData = await dynamo
      .query({
        TableName: 'Chat-Conversations',
        IndexName: 'Username-ConversationId-index',
        Select: 'ALL_PROJECTED_ATTRIBUTES',
        KeyConditionExpression: 'Username = :username',
        ExpressionAttributeValues: { ':username': { S: 'Student' } },
      })
      .promise();

    const ids = conversationIdsData.Items.map((item) => item.ConversationId.S);

    result = await Promise.all(
      ids.map(async (id) => {
        const lastMessageData = await dynamo
          .query({
            TableName: 'Chat-Messages',
            ProjectionExpression: '#T',
            Limit: 1,
            ScanIndexForward: true,
            KeyConditionExpression: 'ConversationId = :id',
            ExpressionAttributeNames: { '#T': 'Timestamp' },
            ExpressionAttributeValues: { ':id': { S: id } },
          })
          .promise();

        const participantsData = await dynamo
          .query({
            TableName: 'Chat-Conversations',
            Select: 'ALL_ATTRIBUTES',
            KeyConditionExpression: 'ConversationId = :id',
            ExpressionAttributeValues: { ':id': { S: id } },
          })
          .promise();

        const participants = participantsData.Items.map((item) => item.Username.S);

        return {
          id,
          last: Number(lastMessageData.Items[0].Timestamp.N),
          participants,
        };
      }),
    );
  } else if (path.startsWith('conversations/') && event.httpMethod === 'GET') {
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
  } else if (path.startsWith('conversations/') && event.httpMethod === 'POST') {
    const id = path.substring('conversations/'.length);
    await dynamo
      .putItem({
        TableName: 'Chat-Messages',
        Item: {
          ConversationId: { S: id },
          Timestamp: {
            N: '' + new Date().getTime(),
          },
          Message: { S: event.body },
          Sender: { S: 'Student' },
        },
      })
      .promise();
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
