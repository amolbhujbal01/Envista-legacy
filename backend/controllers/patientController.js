const dbService = require('../services/dbService');

const insertPatient = async (req, res) => {
    const { name, email, phone, gender, address, date_of_birth, ssn, pms_id } = req.body;
    const { user } = req; // Get user details from the middleware

    if (!name || !email || !phone || !gender || !address || !date_of_birth) {
        return res.status(400).send('Missing required fields');
    }

    try {
        // Get tenant_id, practice_id from UserPractice table
        const userPracticeQuery = `
            SELECT tenant_id, practice_id 
            FROM UserPractice 
            WHERE tenant_id = ?
        `;
        const userPracticeResults = await dbService.query(userPracticeQuery, [user.sub]);

        if (userPracticeResults.length === 0) {
            console.error(`User practice not found for tenant_id: ${user.sub}`);
            return res.status(404).send('Oops, something went wrong. Please try again later.');
        }

        const { tenant_id, practice_id } = userPracticeResults[0];

        // Get dental_practice_id from Dental_Practice table
        const dentalPracticeQuery = `
            SELECT dental_practice_id 
            FROM Dental_Practice 
            WHERE tenant_id = ? AND practice_id = ?
        `;
        const dentalPracticeResults = await dbService.query(dentalPracticeQuery, [tenant_id, practice_id]);

        if (dentalPracticeResults.length === 0) {
            console.error(`Dental practice not found for tenant_id: ${tenant_id} and practice_id: ${practice_id}`);
            return res.status(404).send('Oops, something went wrong. Please try again later.');
        }

        const { dental_practice_id } = dentalPracticeResults[0];

        // Insert the new patient
        const query = `
            INSERT INTO Patient (tenant_id, dental_practice_id, practice_id, name, email, phone, gender, address, date_of_birth, ssn, pms_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [tenant_id, dental_practice_id, practice_id, name, email, phone, gender, address, date_of_birth,ssn,pms_id];
        await dbService.query(query, values);

        res.status(201).send('Patient onboarded successfully');
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Oops, something went wrong. Please try again later.');
    }
};


const getAllPatients = async (req, res) => {
    const { user } = req;
    const queryParams = req.query;

    // Define allowed columns as an enum
    const allowedColumns = {
        patient_id: 'patient_id',
        tenant_id: 'tenant_id',
        dental_practice_id: 'dental_practice_id',
        practice_id: 'practice_id',
        name: 'name',
        email: 'email',
        phone: 'phone',
        gender: 'gender',
        address: 'address',
        date_of_birth: 'date_of_birth',
    };

    try {
        // Get tenant_id, practice_id from UserPractice table
        const userPracticeQuery = `
            SELECT tenant_id, practice_id 
            FROM UserPractice 
            WHERE tenant_id = ?
        `;
        const userPracticeResults = await dbService.query(userPracticeQuery, [user.sub]);

        if (userPracticeResults.length === 0) {
            return res.status(404).json({ error: 'User practice not found' });
        }

        const { tenant_id, practice_id } = userPracticeResults[0];

        // Retrieve all patients for the tenant and practice
        let baseQuery = `
            SELECT * 
            FROM Patient 
            WHERE tenant_id = ? AND practice_id = ?
        `;
        let countQuery = `
            SELECT COUNT(*) as count 
            FROM Patient 
            WHERE tenant_id = ? AND practice_id = ?
        `;
        const queryValues = [tenant_id, practice_id];
        const countValues = [...queryValues];

        // Add additional filters based on query parameters
        for (const param of Object.keys(queryParams)) {
            if (param !== 'page' && param !== 'limit') {
                if (allowedColumns[param]) {
                    baseQuery += ` AND ${param} LIKE ?`;
                    countQuery += ` AND ${param} LIKE ?`;
                    queryValues.push(`%${queryParams[param]}%`);
                    countValues.push(`%${queryParams[param]}%`);
                } else {
                    return res.status(400).json({ error: `Invalid parameter: ${param}` });
                }
            }
        }

        // Default sorting by created_at in descending order
        baseQuery += ` ORDER BY created_at DESC`;

        // Get total count of records
        const countResults = await dbService.query(countQuery, countValues);
        const totalRecords = countResults[0].count;

        // Add pagination
        const page = parseInt(queryParams.page) || null;
        const limit = parseInt(queryParams.limit) || null;

        let pagination = {};

        if (page !== null && limit !== null) {
            const offset = (page - 1) * limit;
            baseQuery += ` LIMIT ? OFFSET ?`;
            queryValues.push(limit, offset);

            const totalPages = Math.ceil(totalRecords / limit);
            pagination = {
                totalRecords,
                totalPages,
                currentPage: page,
                pageSize: limit
            };
        }

        const results = await dbService.query(baseQuery, queryValues);
        
        res.status(200).json({
            data: results,
            pagination: page !== null && limit !== null ? pagination : undefined
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Oops, something went wrong. Please try again later.' });
    }
};



const getPatientById = async (req, res) => {
    const { patient_id } = req.params;
    const { user } = req;

    try {
        // Get tenant_id, practice_id from UserPractice table
        const userPracticeQuery = `
            SELECT tenant_id, practice_id 
            FROM UserPractice 
            WHERE tenant_id = ?
        `;
        const userPracticeResults = await dbService.query(userPracticeQuery, [user.sub]);

        if (userPracticeResults.length === 0) {
            return res.status(404).send('User practice not found');
        }

        const { tenant_id, practice_id } = userPracticeResults[0];

        // Retrieve the patient by patient_id, tenant_id, and practice_id
        const query = 'SELECT * FROM Patient WHERE patient_id = ? AND tenant_id = ? AND practice_id = ?';
        const results = await dbService.query(query, [patient_id, tenant_id, practice_id]);

        if (results.length === 0) {
            return res.status(404).send('Patient not found');
        }

        res.status(200).json(results[0]);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Oops, something went wrong. Please try again later.');
    }
};


module.exports = {
    insertPatient,
    getAllPatients,
    getPatientById
};
