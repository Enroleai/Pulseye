export class Latestsnapshot {
    constructor(
        private _id: string, 
        private name: string,
         private activeStatus: string,
          private employeeid: string,
           private latest: string,
           private date:string|Date
           ) {

    }
}