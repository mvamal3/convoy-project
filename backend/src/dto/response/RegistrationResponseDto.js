class RegistrationResponseDto {
  constructor(registration) {

    


    this.reg_id = registration.reg_id;
    this.owner_name = registration.owner_name;
    this.org_name = registration.org_name;
    this.owner_contact = registration.owner_contact;
    this.owner_address = registration.owner_address;
    this.is_org = registration.is_org;
    this.status = registration.status;
    this.doc_id = registration.doc_id;
    this.doc_id_type = registration.doc_id_type;
    // Optional nested user
    if (registration.user) {
      this.user = {
        id: registration.user.id,
        email: registration.user.email,
        name: registration.user.name,
        role: registration.user.role
      };
    }
  }
}

module.exports = RegistrationResponseDto;