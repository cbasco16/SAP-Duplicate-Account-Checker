using com.myorg.duplicatecheck as db from '../db/schema';

service DuplicateCheckService {
    entity Persons as projection on db.Persons {
        *
    } excluding { aiScore, aiWarning };

    action confirmSave(
        firstName         : String,
        lastName          : String,
        companyName       : String,
        email             : String,
        phone             : String,
        street            : String,
        postalCode        : String,
        city              : String,
        region            : String,
        country           : String,
        taxNumber         : String,
        bankHolderName    : String,
        bankAccountNumber : String,
        bankName          : String
    ) returns String;
}