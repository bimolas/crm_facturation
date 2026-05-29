const http = require('http');

const request = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

async function seed() {
  console.log("Registering Buyer...");
  const buyerEmail = 'buyer' + Date.now() + '@effix.com';
  const buyer = await request({
    hostname: 'localhost', port: 3001, path: '/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: buyerEmail,
    password: 'password123',
    firstName: 'John',
    lastName: 'Buyer',
    companyName: 'Effix Buyer Corp',
    ice: '123456',
    rc: '654321',
    taxId: 'TAX123'
  });
  console.log("Buyer response:", buyer);
  const buyerToken = buyer.accessToken || buyer.token;
  const buyerCompanyId = buyer.user?.companyId || buyer.companyId || (buyer.user && buyer.user.company ? buyer.user.company.id : 1);

  console.log("Registering Vendor...");
  const vendor = await request({
    hostname: 'localhost', port: 3001, path: '/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'vendor' + Date.now() + '@tech.com',
    password: 'password123',
    firstName: 'Alice',
    lastName: 'Vendor',
    companyName: 'Tech Vendor Ltd',
    ice: '987654',
    rc: '456789',
    taxId: 'TAX987'
  });
  const vendorToken = vendor.accessToken || vendor.token;
  const vendorCompanyId = vendor.user?.companyId || vendor.companyId || (vendor.user && vendor.user.company ? vendor.user.company.id : 2);

  console.log("Creating RFP as Buyer...");
  const rfp = await request({
    hostname: 'localhost', port: 3001, path: '/workflows', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + buyerToken }
  }, {
    title: 'New Website Design',
    description: 'We need a new modern website for our corp.',
    technicalCategory: 'IT Services',
    budgetCeiling: 15000,
    submissionDeadline: new Date(Date.now() + 864000000).toISOString(),
    expectedDeliveryDate: new Date(Date.now() + 864000000 * 3).toISOString(),
    evaluationCriteria: 'Experience and price',
    contactEmail: buyerEmail,
    workflowType: 'service',
    region: 'North America',
    buyerCompanyId: buyerCompanyId
  });

  console.log("RFP created:", rfp);

  console.log("Publishing RFP...", rfp.id);
  await request({
    hostname: 'localhost', port: 3001, path: `/workflows/${rfp.id}/publish`, method: 'POST',
    headers: { 'Authorization': 'Bearer ' + buyerToken }
  });

  console.log("Submitting Bid as Vendor...");
  const bid = await request({
    hostname: 'localhost', port: 3001, path: `/workflows/${rfp.id}/bids`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + vendorToken }
  }, {
    referenceNumber: 'BID-' + Date.now(),
    issueDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 864000000).toISOString(),
    sellerCompanyId: vendorCompanyId,
    amount: 14000,
    deliveryLeadTime: 30,
    downPaymentPercentage: 20,
    balanceDueDays: 30,
    vendorNotes: 'We can deliver this in 30 days.'
  });
  console.log("Bid submitted: ", bid);
  console.log("Log in with the buyer to see the bid: ", buyerEmail, " / password123");
}
seed().catch(console.error);
