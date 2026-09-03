// --- CONFIGURATION ---
const USERNAME = 'sifatuul'; 
const REPO = 'CRHSC';           
const BRANCH = 'main';                   

// --- DOM ELEMENTS ---
const chapterList = document.getElementById('chapter-list');
const chapterTitle = document.getElementById('chapter-title');
const assetsContainer = document.getElementById('assets-container');
const documentList = document.getElementById('document-list');
const imageGallery = document.getElementById('image-gallery');

// Base API URL
const apiUrl = `https://api.github.com/repos/${USERNAME}/${REPO}/contents`;

// 1. FETCH ALL CHAPTER FOLDERS ON LOAD
async function fetchChapters() {
    chapterList.innerHTML = '<li>অধ্যায় লোড হচ্ছে...</li>';
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch repo contents.');
        
        const contents = await response.json();
        chapterList.innerHTML = ''; 

        const chapters = contents.filter(item => 
            item.type === 'dir' && 
            !['css', 'js', 'assets', '.github'].includes(item.name.toLowerCase())
        );

        chapters.forEach(chapter => {
            const li = document.createElement('li');
            li.textContent = chapter.name;
            li.onclick = () => loadChapterContents(chapter.name, chapter.path, li);
            chapterList.appendChild(li);
        });

    } catch (error) {
        console.error(error);
        chapterList.innerHTML = '<li style="color:#d32f2f;">অধ্যায় লোড করতে ত্রুটি হয়েছে।</li>';
    }
}

// 2. LOAD FILES & FIGS FOR A SPECIFIC CHAPTER
async function loadChapterContents(chapterName, chapterPath, listElement) {
    document.querySelectorAll('.sidebar li').forEach(el => el.classList.remove('active'));
    listElement.classList.add('active');
    chapterTitle.textContent = chapterName;
    assetsContainer.style.display = 'block';
    
    documentList.innerHTML = '<li>ফাইল স্ক্যান করা হচ্ছে...</li>';
    imageGallery.innerHTML = '<p>figs ফোল্ডার স্ক্যান করা হচ্ছে...</p>';

    try {
        const chapterResponse = await fetch(`${apiUrl}/${encodeURIComponent(chapterPath)}`);
        const chapterContents = await chapterResponse.json();

        const docs = [];
        let figsPath = null;

        chapterContents.forEach(item => {
            if (item.type === 'file' && (item.name.endsWith('.pdf') || item.name.endsWith('.docx') || item.name.endsWith('.ai'))) {
                docs.push(item);
            } else if (item.type === 'dir' && item.name.toLowerCase() === 'figs') {
                figsPath = item.path;
            }
        });

        // Render Documents
        documentList.innerHTML = '';
        if (docs.length === 0) {
            documentList.innerHTML = '<li>এই ফোল্ডারে কোনো ডকুমেন্ট পাওয়া যায়নি।</li>';
        } else {
            docs.forEach(doc => {
                const li = document.createElement('li');
                const downloadUrl = `https://raw.githubusercontent.com/${USERNAME}/${REPO}/${BRANCH}/${doc.path}`;
                li.innerHTML = `<a href="${downloadUrl}" target="_blank" download>${doc.name}</a>`;
                documentList.appendChild(li);
            });
        }

        // Render Images from "figs" folder
        imageGallery.innerHTML = '';
        if (figsPath) {
            const figsResponse = await fetch(`${apiUrl}/${encodeURIComponent(figsPath)}`);
            const figsContents = await figsResponse.json();

            const images = figsContents.filter(item => item.name.match(/\.(png|jpg|jpeg|gif|svg)$/i));

            if (images.length === 0) {
                imageGallery.innerHTML = '<p>figs ফোল্ডারে কোনো ছবি পাওয়া যায়নি।</p>';
            } else {
                images.forEach(img => {
                    const imgUrl = `https://raw.githubusercontent.com/${USERNAME}/${REPO}/${BRANCH}/${img.path}`;
                    const card = document.createElement('div');
                    card.className = 'image-card';
                    card.innerHTML = `
                        <img src="${imgUrl}" alt="${img.name}">
                        <p style="font-size: 0.9em; margin-bottom: 8px; word-wrap: break-word;">${img.name}</p>
                        <button class="copy-btn" onclick="copyImageToClipboard('${imgUrl}')">ছবি কপি করুন</button>
                    `;
                    imageGallery.appendChild(card);
                });
            }
        } else {
            imageGallery.innerHTML = '<p>এই অধ্যায়ে কোনো "figs" ফোল্ডার পাওয়া যায়নি।</p>';
        }

    } catch (error) {
        console.error(error);
        documentList.innerHTML = '<li style="color:#d32f2f;">ফাইলের তথ্য লোড করতে সমস্যা হয়েছে।</li>';
        imageGallery.innerHTML = '';
    }
}

// 3. COPY IMAGE LOGIC
async function copyImageToClipboard(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        
        alert('ছবি সফলভাবে ক্লিপবোর্ডে কপি হয়েছে!');
    } catch (err) {
        console.error('Failed to copy image: ', err);
        alert('ছবি কপি করা যায়নি। ব্রাউজার সরাসরি গিটহাব লিঙ্ক থেকে কপি ব্লক করতে পারে, রাইট-ক্লিক করে কপি করার চেষ্টা করুন।');
    }
}

// Run on initial load
fetchChapters();
