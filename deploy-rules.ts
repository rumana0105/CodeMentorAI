import admin from "firebase-admin";
import * as fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./gen-lang-client-0059090479-6e0f8e43561b.json", "utf8"));
const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: config.projectId
});

async function deploy() {
  try {
    const rules = fs.readFileSync("./firestore.rules", "utf8");
    const securityRules = admin.securityRules();
    
    const ruleset = await securityRules.createRuleset({
      name: "firestore.rules",
      content: rules
    });
    
    console.log("Created ruleset:", ruleset.name);
    
    let rulesetName = ruleset.name;
    if (!rulesetName.startsWith("projects/")) {
        rulesetName = `projects/${config.projectId}/rulesets/${ruleset.name}`;
    }
    const dbId = config.firestoreDatabaseId;
    const releaseName = `projects/${config.projectId}/releases/cloud.firestore/${dbId}`;
    
    console.log(`Attempting to release to: ${releaseName}`);

    const token = await admin.app().options.credential?.getAccessToken();
    const accessToken = token?.access_token;
    
    if (!accessToken) {
        throw new Error("Could not get access token");
    }

    const response = await fetch(`https://firebaserules.googleapis.com/v1/projects/${config.projectId}/releases`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: releaseName,
            rulesetName: rulesetName
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes("already exists")) {
            console.log("Release exists, updating...");
            // To update a release, use PATCH
            const patchResponse = await fetch(`https://firebaserules.googleapis.com/v1/${releaseName}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rulesetName: rulesetName
                })
            });
            if (!patchResponse.ok) {
                throw new Error(`Update failed: ${await patchResponse.text()}`);
            }
            console.log("Successfully updated release.");
        } else {
            throw new Error(`Create release failed: ${errorText}`);
        }
    } else {
        console.log("Successfully created release.");
    }
  } catch (error) {
    console.error("Failed:", error);
  }
}

deploy();
