const { BlobServiceClient } = require("@azure/storage-blob");

/**
 * Build connection string from env
 */
const connectionString =
  `DefaultEndpointsProtocol=https;` +
  `AccountName=${process.env.AZURE_STORAGE_ACCOUNT};` +
  `AccountKey=${process.env.AZURE_STORAGE_KEY};` +
  `EndpointSuffix=core.windows.net`;

const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);

/**
 * Upload invoice file to Azure Blob Storage
 */
async function uploadInvoice(buffer, filename) {
  const containerName = process.env.AZURE_STORAGE_CONTAINER;

  const containerClient =
    blobServiceClient.getContainerClient(containerName);

  // Create container if it doesn't exist
  await containerClient.createIfNotExists();

  const blockBlobClient =
    containerClient.getBlockBlobClient(filename);

  await blockBlobClient.uploadData(buffer);

  return blockBlobClient.url;
}

module.exports = { uploadInvoice };
