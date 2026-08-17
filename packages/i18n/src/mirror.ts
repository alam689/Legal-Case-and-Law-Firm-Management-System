/**
 * এক locale-এর গঠন হুবহু আরেকটিতে মানতে বাধ্য করে।
 *
 * আগে পুরো catalogue-এর উপরে একবার প্রয়োগ হত (`LocaleResources`)। এখন
 * প্রতিটি chunk-এ আলাদা করে — তাই key বাদ পড়লে ভুলটা ঠিক সেই file-এই
 * ধরা পড়ে, ৭০০ লাইনের একটি type error-এ নয়।
 */
export type Mirror<T> = {
  [K in keyof T]: T[K] extends string ? string : Mirror<T[K]>;
};
