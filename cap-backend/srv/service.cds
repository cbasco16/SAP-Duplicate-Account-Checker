using com.myorg.duplicatecheck as db from '../db/schema';
service DuplicateCheckService {
    entity Persons as projection on db.Persons {
        *
    } excluding { aiScore, aiWarning }
}
