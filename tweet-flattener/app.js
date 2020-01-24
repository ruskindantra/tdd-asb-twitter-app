'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const sqs = new AWS.SQS();

exports.lambdaHandler = async (event, context) => {
    console.info("Number of tweets " + event.length);
    
    const promises = [];
    for(var i = 0; i < event.length; i++) {
        var tweet = event[i];
        let key = process.env.TWEET_BUCKET_PREFIX + "/" + tweet.id + ".tweet.json";
        let body = JSON.stringify(tweet);
        console.log("Key: " + key);
        
        let params = {
            Bucket: process.env.TWEET_BUCKET,
            Key: key,
            Body: body,
            ContentType: "application/json"
        };
        
        try {
            const response = await s3.upload(params).promise();
            //console.info(response);

            let sqsPayload = {
                MessageBody: JSON.stringify(response),
                QueueUrl: process.env.TWEET_QUEUE
            };
            const sqsResponse = await sqs.sendMessage(sqsPayload).promise();
            //console.info(sqsResponse);

        } catch (e) {
            console.error(e);
        }
    }
    console.info("EXECUTION COMPLETED");
};
