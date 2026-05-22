const cds = require('@sap/cds');
const { scoreRecord } = require('./ai-scoring');

module.exports = cds.service.impl(async function () {
    const { Persons } = this.entities;

    // ✅ Intercept BEFORE CAP validation to strip _userConfirmed
    this.before('CREATE', Persons, (req) => {
        if (req.data._userConfirmed !== undefined) {
            req._userConfirmedFlag = req.data._userConfirmed === true;
            delete req.data._userConfirmed;
        } else {
            req._userConfirmedFlag = req._.req?.body?._userConfirmed === true;
        }
    });

    this.before('CREATE', Persons, async (req) => {
        const { firstName, lastName, email, taxNumber, bankAccountNumber } = req.data;
        console.log('=================================');
        console.log('[CAP] New record received:', { firstName, lastName, email, taxNumber, bankAccountNumber });

        // ✅ Read from flag set by first before handler
        const userConfirmed = req._userConfirmedFlag === true;
        console.log('[CAP] User confirmed:', userConfirmed);

        // Remove fields that don't exist in HANA schema
        delete req.data.aiScore;
        delete req.data.aiWarning;

        // Step 1 — Exact duplicate check
        const exactDuplicates = [];
        const emailMatch = email ? await SELECT.one.from(Persons).where({ email }) : null;
        const taxMatch = taxNumber ? await SELECT.one.from(Persons).where({ taxNumber }) : null;
        const bankMatch = bankAccountNumber ? await SELECT.one.from(Persons).where({ bankAccountNumber }) : null;

        if (emailMatch) exactDuplicates.push('Email Address');
        if (taxMatch)   exactDuplicates.push('Tax Number');
        if (bankMatch)  exactDuplicates.push('Bank Account Number');

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
                .columns(
                    'ID', 'firstName', 'lastName', 'companyName',
                    'email', 'phone',
                    'street', 'postalCode', 'city', 'region', 'country',
                    'taxNumber', 'bankHolderName', 'bankAccountNumber', 'bankName'
                )
                .limit(50);

            console.log('[CAP] Existing records query result count:', existingRecords.length);
            console.log(`[CAP] Sending ${existingRecords.length} existing records to n8n`);

            const aiResult = await scoreRecord(req.data, existingRecords);
            console.log('[CAP] n8n response received:', aiResult);
            console.log(`[CAP] Score: ${aiResult.score}/100 | Decision: ${aiResult.decision}`);

            if (aiResult.score < 50) {
                console.log('[CAP] BLOCKING record - score too low');
                req.error(409, JSON.stringify({
                    type: 'AI_DUPLICATE',
                    score: aiResult.score,
                    reason: aiResult.reason,
                    matchedRecords: aiResult.matchedRecords,
                    recommendations: aiResult.recommendations
                }));

            } else if (aiResult.score < 80) {
                if (!userConfirmed) {
                    console.log('[CAP] WARNING - returning warn to frontend for user decision');
                    req.error(409, JSON.stringify({
                        type: 'AI_WARN',
                        score: aiResult.score,
                        reason: aiResult.reason,
                        matchedRecords: aiResult.matchedRecords,
                        recommendations: aiResult.recommendations
                    }));
                } else {
                    console.log('[CAP] User confirmed WARN — allowing save');
                }

            } else {
                console.log('[CAP] PASS - record is unique, saving');
            }

        } catch (err) {
            console.error('[CAP] n8n call failed:', err.message);
        }
        console.log('=================================');
    });

    // ✅ Confirmed save action — bypasses duplicate check
    this.on('confirmSave', async (req) => {
        const data = req.data;
        console.log('[CAP] Confirmed save — inserting record directly:', data);
        await INSERT.into(Persons).entries({
            ID: cds.utils.uuid(),
            ...data
        });
        console.log('[CAP] Record saved successfully after user confirmation');
        return 'SAVED';
    });

});