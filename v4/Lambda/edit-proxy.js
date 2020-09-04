var AWS = require('aws-sdk');

var S3 = new AWS.S3();

var bucket = 'sheen-serverless-chat';

exports.handler = async (event) => {
  const path = event.pathParameters.proxy;
  let key;

  if (path === 'conversations') {
    key = 'data/conversations.json';
  } else if (path.startsWith('conversations/')) {
    const id = path.substring('conversations/'.length);
    key = `data/conversations/${id}.json`;
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify('Route Not Found'),
    };
  }

  const params = {
    Bucket: bucket,
    Key: key,
  };

  let s3Obj;

  try {
    const s3Data = await S3.getObject(params).promise();
    s3Obj = JSON.parse(s3Data.Body.toString('utf-8'));
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify(e),
    };
  }

  // TODO implement
  const response = {
    statusCode: 200,
    body: JSON.stringify(s3Obj),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  };
  return response;
};
