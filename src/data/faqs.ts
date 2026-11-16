import type { Faq } from './content';

export const HOME_FAQS: Faq[] = [
  {
    q: 'Are the tools really free?',
    a: 'Yes. Every tool is free to use with no account and no usage limit. The site is designed to be supported by advertising, and ads are never placed over a tool’s input or output.',
  },
  {
    q: 'Is the code or data I paste sent to a server?',
    a: 'No. Each tool is JavaScript that runs in your browser tab. Your JSON, queries, IDs and field names are processed on your device and are not uploaded, logged or stored by us.',
  },
  {
    q: 'Do I need to log in to Salesforce?',
    a: 'No. The tools never connect to an org. That keeps them safe to use with any project, and it also means they cannot check your input against your org’s objects and fields.',
  },
  {
    q: 'Is Titrova made by Salesforce?',
    a: 'No. Titrova is an independent project and is not affiliated with or endorsed by Salesforce, Inc. Always review generated code before you deploy it.',
  },
  {
    q: 'Can I use the tools on my phone?',
    a: 'Yes. Every page adapts to phones, tablets and desktops, and all controls work with touch and with a keyboard.',
  },
  {
    q: 'Can I suggest a tool or report a problem?',
    a: 'Please do. The Contact page explains how to send a suggestion or a bug report. A short example of the input that went wrong helps a lot.',
  },
];
