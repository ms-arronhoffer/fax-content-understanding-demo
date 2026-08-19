@description('Azure region for all resources. Content Understanding + the model deployments below must be available in this region.')
param location string = 'centralus'

@description('Short unique suffix used to build globally-unique resource names.')
param baseSuffix string = uniqueString(resourceGroup().id)

@description('Analyzer ID that must match content-understanding/analyzer-schema.json (analyzerId field).')
param analyzerId string = 'fax_document_analyzer'

@description('Name of the GPT model deployment used by Content Understanding for classify/generate fields.')
param gptDeploymentName string = 'gpt-5.4-mini'

@description('Model version for the GPT deployment. Verify current supported version for your region/quota before deploying.')
param gptModelVersion string = '2026-03-17'

@description('Capacity (in thousands of tokens per minute) for the GPT deployment.')
param gptCapacity int = 10

@description('Name of the embedding model deployment used by Content Understanding.')
param embeddingDeploymentName string = 'text-embedding-3-large'

@description('Model version for the embedding deployment.')
param embeddingModelVersion string = '1'

@description('Capacity (in thousands of tokens per minute) for the embedding deployment.')
param embeddingCapacity int = 10

var storageAccountName = toLower('stfaxcu${baseSuffix}')
var foundryAccountName = 'aif-faxcu-${baseSuffix}'
var logicAppName = 'logic-faxcu-${baseSuffix}'
var blobConnectionName = 'azureblob-faxcu-${baseSuffix}'
var incomingContainerName = 'incoming'
var processedContainerName = 'processed'
var errorsContainerName = 'errors'

// Built-in "Cognitive Services User" role — lets the Logic App's managed identity call
// the Content Understanding analyze/poll APIs without needing an API key.
var cognitiveServicesUserRoleId = 'a97b65f3-24c7-4388-baec-2e87135dc908'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource incomingContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: incomingContainerName
  properties: {
    publicAccess: 'None'
  }
}

resource processedContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: processedContainerName
  properties: {
    publicAccess: 'None'
  }
}

resource errorsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: errorsContainerName
  properties: {
    publicAccess: 'None'
  }
}

resource foundryAccount 'Microsoft.CognitiveServices/accounts@2025-04-01-preview' = {
  name: foundryAccountName
  location: location
  kind: 'AIServices'
  sku: {
    name: 'S0'
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    customSubDomainName: foundryAccountName
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false
  }
}

resource gptDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-04-01-preview' = {
  parent: foundryAccount
  name: gptDeploymentName
  sku: {
    name: 'GlobalStandard'
    capacity: gptCapacity
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-5.4-mini'
      version: gptModelVersion
    }
  }
}

resource embeddingDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-04-01-preview' = {
  parent: foundryAccount
  name: embeddingDeploymentName
  sku: {
    name: 'GlobalStandard'
    capacity: embeddingCapacity
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'text-embedding-3-large'
      version: embeddingModelVersion
    }
  }
  dependsOn: [
    gptDeployment
  ]
}

resource blobConnection 'Microsoft.Web/connections@2016-06-01' = {
  name: blobConnectionName
  location: location
  properties: {
    displayName: blobConnectionName
    api: {
      id: subscriptionResourceId('Microsoft.Web/locations/managedApis', location, 'azureblob')
    }
    parameterValues: {
      accountName: storageAccount.name
      accessKey: storageAccount.listKeys().keys[0].value
    }
  }
}

resource logicApp 'Microsoft.Logic/workflows@2019-05-01' = {
  name: logicAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    state: 'Enabled'
    definition: loadJsonContent('../logic-app/workflow.json')
    parameters: {
      '$connections': {
        value: {
          azureblob: {
            connectionId: blobConnection.id
            connectionName: blobConnectionName
            id: subscriptionResourceId('Microsoft.Web/locations/managedApis', location, 'azureblob')
          }
        }
      }
      contentUnderstandingEndpoint: {
        value: 'https://${foundryAccountName}.cognitiveservices.azure.com'
      }
      analyzerId: {
        value: analyzerId
      }
      storageAccountName: {
        value: storageAccount.name
      }
      incomingContainerName: {
        value: incomingContainerName
      }
      processedContainerName: {
        value: processedContainerName
      }
      errorsContainerName: {
        value: errorsContainerName
      }
    }
  }
  dependsOn: [
    incomingContainer
    processedContainer
    errorsContainer
  ]
}

resource logicAppFoundryRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(foundryAccount.id, logicApp.id, cognitiveServicesUserRoleId)
  scope: foundryAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', cognitiveServicesUserRoleId)
    principalId: logicApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

output storageAccountName string = storageAccount.name
output foundryAccountName string = foundryAccount.name
output foundryEndpoint string = 'https://${foundryAccountName}.cognitiveservices.azure.com'
output logicAppName string = logicApp.name
output logicAppPrincipalId string = logicApp.identity.principalId
