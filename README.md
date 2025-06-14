# Background Remover Web App

A simple and elegant web application that lets users upload images, remove backgrounds, and download the results with transparent backgrounds.

## Features

- **Easy Image Upload**: Drag & drop or click to select images
- **One-Click Background Removal**: Remove backgrounds instantly with ML technology
- **Quick Download**: Save processed images with transparent backgrounds
- **User-Friendly Interface**: Clean, responsive design for all devices
- **Input Validation**: Handles file type and size restrictions

## Technology

This project uses:

- **Next.js** - React framework with server-side rendering
- **TypeScript** - For type safety and better developer experience
- **Tailwind CSS** - For responsive and modern UI design
- **@imgly/background-removal** - For AI-powered background removal

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app in action.

## How to Use

1. Click the upload area or drag & drop an image
2. Wait for the image to load
3. Click "Remove Background" button
4. Once processing is complete, click "Download Image" to save the result
5. Use the "Try Another Image" button to process another image

## Limitations

- Maximum file size: 10MB
- Supported formats: JPEG, PNG
- Processing time may vary depending on image size and complexity

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
