'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();

function invokeLambda(lambdaArn, payload) {
    const params = {
        FunctionName: lambdaArn,
        InvocationType: 'Event',
        Payload: JSON.stringify(payload)
    };

    return new Promise((resolve, reject) => {

        lambda.invoke(params, (err,data) => {
            if (err) {
                console.log(err, err.stack);
                reject(err);
            }
            else {
                console.log(data);
                resolve(data);
            }
        });     
    });
}

exports.lambdaHandler = async (event, context) => {

    console.info("Number of events received: " + event.Records.length);

    let allTweets = [];
    for(var i = 0; i < event.Records.length; i++) {
        var sqsMessage = event.Records[i];
        let s3Key = sqsMessage.body;
        console.info("SQS message received: " + s3Key);

        let params = {
                Bucket: process.env.TWEET_BUCKET,
                Key: s3Key
            };
        
        const response = await s3.getObject(params).promise();
        let tweetJson = JSON.parse(response.Body.toString());
        console.debug("Response is: " + response.Body.toString());
        console.info("Tweet is: " + tweetJson["full_text"]);
        allTweets.push(tweetJson);
    }

    //invoke the analyser asynchronously
    console.info("Invoking lambda: " + process.env.TWEET_SENTIMENT_LAMBDA);

    await invokeLambda(process.env.TWEET_SENTIMENT_LAMBDA, allTweets);
    
    //console.info("EVENT\n" + event);
};
