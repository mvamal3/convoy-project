class RegistrationDto {
  constructor(data) {
    // ✅ Registration fields
  
    this.owner_name = data.owner_name;
    this.org_name = data.org_name || null;
    this.owner_contact = data.owner_contact;
    this.owner_address = data.owner_address;
    this.is_org = data.is_org ?? 0;
    this.status = data.status ?? 1;
    this.doc_id = data.doc_id || null;
    this.doc_id_type = data.doc_id_type || null;
    // ✅ User fields (skip user_id since it's foreign key derived from user)
    this.email = data.email;
    this.password = data.password;
    this.name= data.name;

    this.role = data.role || 'user';
    this.isActive = data.isActive ?? true;
  }

validate() {
  const errors = [];


  const name = this.owner_name?.trim();
  const owner_contact = this.owner_contact?.trim();
  const owner_address = this.owner_address?.trim();
  const email = this.email?.trim();
  const password = this.password?.trim();


  // Required fields check
  
  if (!name) errors.push('Owner name is required');
  if (!owner_contact) errors.push('Owner contact is required');
  if (!owner_address) errors.push('Owner address is required');
  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');

  // Format validations
  if (owner_contact && !/^[6-9]\d{9}$/.test(owner_contact)) {
    errors.push('Invalid mobile number format');
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }

  if (password && password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

}

module.exports = RegistrationDto;