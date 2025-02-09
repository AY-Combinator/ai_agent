import { SecretVaultWrapper } from 'nillion-sv-wrappers';
import { v4 as uuidv4 } from 'uuid';
import { orgConfig } from './nillionOrgConfig.js';
// --------------------------------------------------------------------------------------------
// -----NOTE This is just for testing, NILLION is directly integrated in moduleProgress.ts file
// --------------------------------------------------------------------------------------------
const SCHEMA_ID = 'ac706abf-e7f1-47bc-bef5-cf21f9d9ce31';
const data = [
    {
        _id: uuidv4(),
        module_type: { $share: 'problemFraming' },
        completed_at: { $share: new Date().toISOString() },
        sections: [
            {
                section_name: { $share: 'problemStatement' },
                answers: [
                    { $share: 'Market inefficiency in DeFi lending' },
                    { $share: 'Small to medium-sized businesses' },
                    { $share: 'Limited access to working capital' }
                ]
            },
            {
                section_name: { $share: 'contextBackground' },
                answers: [
                    { $share: 'Traditional lending requires high collateral' },
                    { $share: 'Current DeFi solutions lack flexibility' },
                    { $share: 'Growing demand for alternative financing' }
                ]
            }
        ]
    }
];

async function main() {
    try {
        // Create a secret vault wrapper and initialize the SecretVault collection to use
        const collection = new SecretVaultWrapper(
            orgConfig.nodes,
            orgConfig.orgCredentials,
            SCHEMA_ID
        );
        await collection.init();

        // Write collection data to nodes encrypting the specified fields ahead of time
        const dataWritten = await collection.writeToNodes(data);
        console.log(
            '✅ Data written to nodes:',
            JSON.stringify(dataWritten, null, 2)
        );

        // Get the ids of the SecretVault records created
        const newIds = [
            ...new Set(dataWritten.map((item) => item.result.data.created).flat()),
        ];
        console.log('📝 Record IDs:', newIds);

        // Read all collection data from the nodes, decrypting the specified fields
        const decryptedData = await collection.readFromNodes({});

        // Log first 5 records
        console.log(
            '🔓 Decrypted records:',
            decryptedData.slice(0, data.length)
        );
    } catch (error) {
        console.error('❌ SecretVaultWrapper error:', error.message);
        process.exit(1);
    }
}

main();