"use strict";

const cds = require("@sap/cds");
const logger = cds.log('logger');
const utils = require("../../utils/Utils");


//Amount fields in object
function _getAmountPropertiesForDataCleaning () {
    return [
        "ProjectBaselineSpend",
        "BaselineSpend",
        "EstimatedSpend",
        "EstimatedSavings",
        "EstimatedSavingsPct",
        "NegotiatedSpend",
        "NegotiatedSavings",
        "NegotiatedSavingsPct",
        "ImplementedSpend",
        "ImplementedSavings",
        "ImplementedSavingsPct",
        "ActualSpend",
        "ActualSavings",
        "ActualSavingsPct",
        "ProjectBaselineSpendB",
        "ProjectBaselineSpendC",
        "BaselineSpendB",
        "BaselineSpendC",
        "EstimatedSpendB",
        "EstimatedSpendC",
        "EstimatedSavingsB",
        "EstimatedSavingsC",
        "NegotiatedSpendB",
        "NegotiatedSpendC",
        "NegotiatedSavingsB",
        "NegotiatedSavingsC",
        "ImplementedSpendB",
        "ImplementedSpendC",
        "ImplementedSavingsB",
        "ImplementedSavingsC",
        "ActualSpendB",
        "ActualSpendC",
        "ActualSavingsB",
        "ActualSavingsC"
    ];
}


function insertData(aData, realm)  {
    return new Promise(async function(resolve, reject)    {

        const srv = cds.transaction(aData);
        if (!aData || aData.length === 0) {
            resolve(0);
            return;
        }        logger.info(`Processing ${aData.length} records`);
        var aCleaningProperties = _getAmountPropertiesForDataCleaning();
        let i=0;
        for(const oData of aData) {

            var oDataCleansed = utils.cleanData(aCleaningProperties, oData, realm);
            var oDataCleansed = utils.processCustomFields(oDataCleansed);

            try {
                //Select record by Unique key
                let res =  await srv.run ( SELECT.from ("sap.ariba.SavingsAllocationDetails").where(
                    {
                        Realm : oDataCleansed.Realm ,
                        SavingsAllocationId : oDataCleansed.SavingsAllocationId
                    })
                 );

                if(res.length==0){
                     //New record, insert
                    await srv.run( INSERT .into ("sap.ariba.SavingsAllocationDetails") .entries (oDataCleansed) );

                } else {
                    //Update existing record
                    await srv.run ( UPDATE ("sap.ariba.SavingsAllocationDetails") .set (oDataCleansed) .where(
                        {
                            Realm : oDataCleansed.Realm ,
                            SavingsAllocationId : oDataCleansed.SavingsAllocationId
                        })
                    );

                }

            } catch (e) {
                logger.error(`Error on inserting data in database, aborting file processing, details ${e} `);
                await srv.rollback();
                //abort full file
                reject(e);
                break;
            }
            //Monitoring
            i++;
            if(i%500 ==0){
                logger.info(`Upsert ${i} records`);
            }

        }
        await srv.commit();
        resolve(aData.length);
    });

}




module.exports = {
    insertData
}