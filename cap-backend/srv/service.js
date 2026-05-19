const cds = require('@sap/cds');
const { scoreRecord } = require('./ai-scoring');

module.exports = cds.service.impl(async function () {
    const { Persons } = this.entities;

    this.before('CREATE', Persons, async (req) => {
        const { firstName, lastName, email, taxNumber, bankAccountNumber } = req.data;

        console.log('=================================');
        console.log('[CAP] New record received:', { firstName, lastName, email });

        // Step 1 — Exact duplicate check
        const exactDuplicates = [];

        const emailMatch = email ? await SELECT.one.from(Persons).where({ email }) : null;
        const taxMatch = taxNumber ? await SELECT.one.from(Persons).where({ taxNumber }) : null;
        const bankMatch = bankAccountNumber ? await SELECT.one.from(Persons).where({ bankAccountNumber }) : null;
        const nameMatch = firstName && lastName ? await SELECT.one.from(Persons).where({ firstName, lastName }) : null;

        if (emailMatch)  exactDuplicates.push('Email Address');
        if (taxMatch)    exactDuplicates.push('Tax Number');
        if (bankMatch)   exactDuplicates.push('Bank Account Number');
        if (nameMatch)   exactDuplicates.push('Full Name');

        if (exactDuplicates.length > 0) {
            console.log('[CAP] Exact duplicate found:', exactDuplicates);
            req.error(409, JSON.stringify({
                type: 'EXACT_DUPLICATE',
                fields: exactDuplicates,
                score: 0,
                reason: `Exact duplicate found on: ${exactDuplicates.join(', ')}`
            }));
            return;
        }

        console.log('[CAP] No exact duplicates found. Calling n8n...');

        // Step 2 — AI fuzzy duplicate scoring
        try {
            const existingRecords = await SELECT.from(Persons)
                .columns('ID', 'firstName', 'lastName', 'email',
                         'phone', 'taxNumber', 'bankAccountNumber', 'bankName')
                .limit(50);

            console.log(`[CAP] Sending ${existingRecords.length} existing records to n8n`);

            const aiResult = await scoreRecord(req.data, existingRecords);

            console.log('[CAP] n8n response received:', aiResult);
            console.log(`[CAP] Score: ${aiResult.score}/100 | Decision: ${aiResult.decision}`);

            req.data.aiScore = aiResult.score;

            if (aiResult.score < 50) {
                console.log('[CAP] BLOCKING record - score too low');
                req.error(409, JSON.stringify({
                    type: 'AI_DUPLICATE',
                    score: aiResult.score,
                    reason: aiResult.reason,
                    duplicates: aiResult.duplicates,
                    recommendations: aiResult.recommendations
                }));
            } else if (aiResult.score < 80) {
                console.log('[CAP] WARNING - score in grey zone');
                req.data.aiWarning = aiResult.reason;
            } else {
                console.log('[CAP] PASS - record is unique');
            }

        } catch (err) {
            console.error('[CAP] n8n call failed:', err.message);
            console.error('[CAP] Full error:', err);
        }

        console.log('=================================');
    });
});