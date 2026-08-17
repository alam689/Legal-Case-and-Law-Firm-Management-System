/**
 * বিচার সংশ্লিষ্ট প্রতিষ্ঠান — বাহ্যিক সরকারি ওয়েবসাইটের রেফারেন্স লিংক।
 *
 * ⚠ CaseFlow BD এই প্রতিষ্ঠানগুলোর সাথে সম্পর্কিত নয়, তাদের অনুমোদিতও নয়।
 * এগুলো নিছক সুবিধার্থে দেওয়া বাহ্যিক লিংক — UI-তেও সেটি স্পষ্ট লেখা আছে
 * (README positioning: platform কখনো সরকারি system-এর প্রতিস্থাপন নয়)।
 *
 * TODO(pre-launch): প্রতিটি URL launch-এর আগে যাচাই করতে হবে — সরকারি
 * domain মাঝে মাঝে বদলায়, এবং ভুল লিংক আইনি product-এ বিশ্বাসযোগ্যতা নষ্ট করে।
 */
export interface Institution {
  readonly nameBn: string;
  readonly nameEn: string;
  readonly url: string;
}

export const JUDICIAL_INSTITUTIONS: readonly Institution[] = [
  {
    nameBn: 'বাংলাদেশ সুপ্রীম কোর্ট',
    nameEn: 'Supreme Court of Bangladesh',
    url: 'https://www.supremecourt.gov.bd',
  },
  {
    nameBn: 'বিচার প্রশাসন প্রশিক্ষণ ইনস্টিটিউট',
    nameEn: 'Judicial Administration Training Institute',
    url: 'https://jati.gov.bd',
  },
  {
    nameBn: 'জাতীয় আইনগত সহায়তা প্রদান সংস্থা',
    nameEn: 'National Legal Aid Services Organisation',
    url: 'https://nlaso.gov.bd',
  },
  {
    nameBn: 'আইন, বিচার ও সংসদ বিষয়ক মন্ত্রণালয়',
    nameEn: 'Ministry of Law, Justice and Parliamentary Affairs',
    url: 'https://lawjusticediv.gov.bd',
  },
  {
    nameBn: 'বাংলাদেশ জুডিসিয়াল সার্ভিস কমিশন',
    nameEn: 'Bangladesh Judicial Service Commission',
    url: 'https://bjsc.gov.bd',
  },
  {
    nameBn: 'বাংলাদেশ বার কাউন্সিল',
    nameEn: 'Bangladesh Bar Council',
    url: 'http://www.barcouncil.gov.bd',
  },
];
