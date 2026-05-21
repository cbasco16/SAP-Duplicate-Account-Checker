namespace com.myorg.duplicatecheck;
entity Persons {
    key ID              : UUID @cds.on.insert: $uuid;
    firstName           : String(100);
    lastName            : String(100);
    companyName         : String(200);
    email               : String(200);
    phone               : String(50);
    street              : String(200);
    postalCode          : String(20);
    city                : String(100);
    region              : String(100);
    country             : String(100);
    taxNumber           : String(100);
    bankHolderName      : String(200);
    bankAccountNumber   : String(100);
    bankName            : String(100);
    createdAt           : Timestamp @cds.on.insert: $now;
}
