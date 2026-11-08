export class employeemodel{
    constructor(
        private _id:string,
        private name:string,
        private email:string,
        private lastLoginDate:string,
        private employeeonboarddate:string,
        private employeeoffboarddate:string,
        private licenseKey:string,
        private activeStatus:string
        )
        {}
}