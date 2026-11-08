const AWS = require('aws-sdk');
const config = require('config');
const { screeshotdetails } = require('../models/screeshotdetails');

function getStorageConfig() {
	const storageConfig = config.get('aws');
	const requiredKeys = ['accessKeyId', 'secretAccessKey', 'endpoint', 'bucket'];
	const missingKeys = requiredKeys.filter((key) => !storageConfig[key]);

	if (missingKeys.length > 0) {
		throw new Error(
			`Storage configuration is incomplete. Set ${missingKeys.join(', ')} through environment variables.`
		);
	}

	return storageConfig;
}

function createS3Client() {
	const storageConfig = getStorageConfig();
	return {
		bucket: storageConfig.bucket,
		client: new AWS.S3({
			endpoint: storageConfig.endpoint,
			accessKeyId: storageConfig.accessKeyId,
			secretAccessKey: storageConfig.secretAccessKey,
			region: storageConfig.region,
			signatureVersion: 'v4',
		}),
	};
}

function startOfLocalDay(date = new Date()) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

async function uploadScreenshots(buf, masterID, workerId) {
	const { bucket, client } = createS3Client();
	const today = startOfLocalDay();
	const now = Date.now();
	const key = `${masterID}/${workerId}/${today}/${now}.jpg`;

	const data = await client
		.putObject({
			Bucket: bucket,
			Key: key,
			Body: buf,
		})
		.promise();

	await new screeshotdetails({
		screenshoturl: key,
		screenshotdate: new Date(),
		masterID,
		employeeid: workerId,
		entrydate: today,
		entrytime: now,
	}).save();

	return data;
}

async function getScreenshots(managerId, workerID, today) {
	const { bucket, client } = createS3Client();
	const prefix = today ? `${managerId}/${workerID}/${today}` : `${managerId}/${workerID}`;
	const data = await client.listObjectsV2({ Bucket: bucket, Prefix: prefix }).promise();

	return (data.Contents || []).map((item) =>
		client.getSignedUrl('getObject', {
			Bucket: bucket,
			Key: item.Key,
			Expires: 300,
		})
	);
}

async function getFilesAtPrefix(prefix) {
	const { bucket, client } = createS3Client();
	const data = await client.listObjectsV2({ Bucket: bucket, Prefix: prefix }).promise();

	return (data.Contents || []).map((item) =>
		client.getSignedUrl('getObject', {
			Bucket: bucket,
			Key: item.Key,
			Expires: 300,
		})
	);
}

function getAgentTool() {
	return getFilesAtPrefix('Download-Pulseye-Agent/Pulseye Agent Setup.zip');
}

function getAgentToolLinux() {
	return getFilesAtPrefix('Download-Pulseye-Agent/Pulseye Agent Setup_linux.zip');
}

function getPresignedUrlS3(prefix) {
	const { bucket, client } = createS3Client();
	return client.getSignedUrl('getObject', {
		Bucket: bucket,
		Key: prefix,
		Expires: 300,
	});
}

module.exports = {
	uploadScreenshots,
	getScreenshots,
	getAgentTool,
	getAgentToolLinux,
	getPresignedUrlS3,
};
