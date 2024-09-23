const s3 = require('../config/awsConfig');

exports.uploadFile = (file, filename) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
    ContentType: file.mimetype,
    // This is necessary for large files. AWS S3 limits the file size for a single upload.
    PartSize: 5 * 1024 * 1024, // 5MB part size (can be adjusted)
    Body: file.buffer
  };

  // Return a Promise
  return new Promise((resolve, reject) => {
    s3.upload(params, { partSize: 5 * 1024 * 1024, queueSize: 10 }, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data);
    });
  });
};

exports.getPresignedUrl = (s3Url) => {
  const url = new URL(s3Url);
  const params = {
    Bucket: url.hostname.split('.')[0],
    Key: decodeURIComponent(url.pathname.substring(1)), // Remove leading '/' and decode
    Expires: 60 * 60 // 1 hour
  };

  return new Promise((resolve, reject) => {
    s3.getSignedUrl('getObject', params, (err, url) => {
      if (err) {
        return reject(err);
      }
      resolve(url);
    });
  });
};

exports.getUploadPresignedUrl = (filename, fileType) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
    ContentType: fileType,
    Expires: 60 * 60, // URL expiration time in seconds (1 hour)
  };

  return s3.getSignedUrlPromise('putObject', params);
};

exports.verifyFileExists = (filename) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
  };
  return s3.headObject(params).promise();
};

exports.getS3FileURL = (filename) => {
  const s3URL = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${encodeURIComponent(filename)}`;
  return s3URL;
};