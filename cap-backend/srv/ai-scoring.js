async function scoreRecord(newRecord, existingRecords) {
    console.log('[n8n] Calling webhook at https://cambridgeai-dev.app.n8n.cloud/webhook/duplicate-score');  

// Added N8N CUPA
    if (existingRecords.length === 0) {
        console.log('[n8n] No existing records - returning score 100');
        return {
            score: 100,
            decision: "PASS",
            reason: "No existing records to compare against.",
            matchedRecords: [],
            recommendations: "Record is unique. Safe to save."
        };
    }

    try {
        const body = JSON.stringify({ newRecord, existingRecords });
        console.log('[n8n] Request body size:', body.length, 'bytes');
// Added N8N CUPA
        const response = await fetch('https://cambridgeai-dev.app.n8n.cloud/webhook/duplicate-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
        });

        console.log('[n8n] Response status:', response.status);

        if (!response.ok) {
            const errText = await response.text();
            console.error('[n8n] Error response:', errText);
            throw new Error(`n8n returned status ${response.status}: ${errText}`);
        }

        const result = await response.json();
        console.log('[n8n] Parsed result:', result);
        return result;

    } catch (err) {
        console.error('[n8n] Fetch failed:', err.message);
        return { score: 100, reason: "AI scoring unavailable.", duplicates: [], decision: "PASS" };
    }
}

module.exports = { scoreRecord };