const CheckoutReportRequestDTO = (body) => {
  return {
    checkpostid: body.checkpostid || null,
    status: body.status || null,
    checkoutdate: body.checkoutdate || null,
    conveyId: body.conveyId || null,
    searchTerm: body.searchTerm || "",
    vehicleSearch: body.vehicleSearch || "",
    page: body.page || null,
    limit: body.limit || null,
  };
};

module.exports = CheckoutReportRequestDTO;
