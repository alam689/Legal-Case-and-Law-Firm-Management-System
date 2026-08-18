/**
 * TypeScript-এর NodeNext import (`'./enums.js'` → `enums.ts`) মেলানো।
 *
 * `packages/*` গুলোতে extension বাধ্যতামূলক এবং সেটি `.js`-ই লেখা হয়,
 * উৎস `.ts` হলেও — TypeScript-এর নিয়মে এটিই সঠিক। Vite ও (config
 * দেওয়ার পরে) Metro এটি সামলায়; Jest-এর resolver হুবহু নামটিই খোঁজে।
 *
 * `moduleNameMapper` দিয়ে করা যেত না: সেটি importer দেখে না, তাই
 * zod-এর নিজের `./v3/external.js`-ও কেটে যেত এবং সেগুলো সত্যিই `.js`।
 * তাই নিয়মটি "আগে যা লেখা আছে তা-ই খোঁজো, **না পেলে** তবেই `.js` ছাঁটো" —
 * অর্থাৎ আসল `.js` ফাইল কখনো আড়ালে পড়ে না।
 *
 * RN-এর নিজস্ব resolver-কেই মোড়ানো হয়েছে (platform extension, `browser`
 * field ইত্যাদি সেখানেই), jest-এর default-কে নয়।
 */
const reactNativeResolver = require(require('jest-expo/jest-preset').resolver);

module.exports = function caseflowResolver(request, options) {
  try {
    return reactNativeResolver(request, options);
  } catch (error) {
    if (request.startsWith('.') && request.endsWith('.js')) {
      return reactNativeResolver(request.slice(0, -3), options);
    }
    throw error;
  }
};
