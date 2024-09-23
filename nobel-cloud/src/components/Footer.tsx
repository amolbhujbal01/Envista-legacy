import LogoWhite from '@/assets/logo-white.svg';
import React from 'react';

const footerLinks = [
  {
    label: 'Privacy Policy',
    url: 'https://envistaco.com/en/privacy-policy',
    target: '_blank',
    rel: 'noopener nofollow',
  },
  {
    label: 'Terms of Use',
    url: 'https://www.nobelbiocare.com/en-us/global-terms-and-conditions-of-use',
    target: '_blank',
    rel: 'noopener nofollow',
  },
  {
    label: 'Warranty',
    url: 'https://www.nobelbiocare.com/en-us/warranty-program',
    target: '_blank',
    rel: 'noopener nofollow',
  },
  {
    label: 'ISO certification',
    url: 'https://www.nobelbiocare.com/en-us/quality-management-according-to-iso-standards',
    target: '_blank',
    rel: 'noopener nofollow',
  },
  {
    label: 'Trademarks',
    url: 'https://www.nobelbiocare.com/en-us/trademarks',
    target: '_blank',
    rel: 'noopener nofollow',
  },
  {
    label: 'Product Complaint Form',
    url: 'https://www.nobelbiocare.com/en-us/product-complaint-form-frequently-asked-questions-faqs',
    target: '_blank',
    rel: 'noopener nofollow',
  },
  {
    label: 'Product Waste Compliance',
    url: 'https://www.nobelbiocare.com/en-us/our-approach-to-recycling',
    target: '_blank',
    rel: 'noopener nofollow',
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="z-20 text-white bg-black">
      <div className="flex flex-col px-5 py-4 mx-auto">
        <div className="!hidden flex flex-wrap items-center justify-center gap-4 py-4 text-sm text-center lg:justify-between max-sm:flex-col">
          {footerLinks.map((link, index) => (
            <React.Fragment key={index}>
              {index === 0 && (
                <span className="max-sm:hidden h-5 w-[1px]"></span>
              )}
              <a href={link.url} target={link.target} rel={link.rel}>
                {link.label}
              </a>
              {index === footerLinks.length - 1 ? (
                <span className="max-sm:hidden h-5 w-[1px]"></span>
              ) : (
                <span className="max-sm:hidden h-5 w-[1px] bg-white"></span>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center justify-between gap-8 text-center max-md:flex-col">
          <img className="h-6" src={LogoWhite} alt="Nobel Biocare logo" />
          <span className="text-sm">
            &copy;{currentYear} Nobel Biocare Services AG. All rights reserved
          </span>
        </div>
      </div>
    </footer>
  );
}
