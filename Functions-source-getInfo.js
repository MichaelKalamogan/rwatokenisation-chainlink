const { ethers } = await import('npm:ethers@6.10.0');

const abiCoder = ethers.AbiCoder.defaultAbiCoder();


const apiResponse = await Functions.makeHttpRequest({
    url: `https://assetvalidator-simulator.onrender.com/api/validate`,
});

const validity = String(apiResponse.data.validate);
// const listPricevalid = Number(apiResponse.data.ListPrice);
// const yearBuilt = Number(apiResponse.data.YearBuilt);

console.log(`Validity: ${validity}`);
// console.log(`List Price: ${listPrice}`);
// console.log(`Year Built: ${yearBuilt}`);

const encoded = abiCoder.encode([`string`], [validity]);

return ethers.getBytes(encoded);
 