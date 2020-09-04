var AWS = require('aws-sdk');

var cognito = new AWS.CognitoIdentityServiceProvider();

exports.handler = async (event) => {
  const userDatas = await cognito
    .listUsers({
      UserPoolId: '<user pool id>',
      AttributesToGet: [],
      Filter: '',
      Limit: 60,
    })
    .promise();

  const logins = userDatas.Users.map((user) => user.Username);

  return logins;
};
