import React, { useState, useEffect } from 'react';
import { 
  addReview, addArticle, getReviews, getArticles, updateArticle, deleteArticle, updateReview, deleteReview,
  getItineraries, addItinerary, updateItinerary, deleteItinerary,
  getCategories, addCategory, updateCategory, deleteCategory
, getHotels, addHotel, updateHotel, deleteHotel } from '../services/contentService';
import ImageUploadField from '../components/Admin/ImageUploadField';
import MultiImageUploadButton from '../components/Admin/MultiImageUploadButton';
import MapCoordinatePicker from '../components/Admin/MapCoordinatePicker';
import { supabase } from '../supabase';


const CITY_COORDINATES = {
  'colombo': { x: 60, y: 280 },
  'kandy': { x: 150, y: 250 },
  'galle': { x: 100, y: 380 },
  'sigiriya': { x: 150, y: 190 },
  'anuradhapura': { x: 130, y: 130 },
  'polonnaruwa': { x: 180, y: 180 },
  'trincomalee': { x: 210, y: 110 },
  'jaffna': { x: 100, y: 30 },
  'nuwara eliya': { x: 160, y: 280 },
  'ella': { x: 180, y: 290 },
  'yala': { x: 220, y: 340 },
  'mirissa': { x: 120, y: 390 },
  'negombo': { x: 60, y: 250 },
  'bentota': { x: 70, y: 320 },
  'arugam bay': { x: 260, y: 280 },
  'dambulla': { x: 150, y: 210 },
  'minneriya': { x: 170, y: 190 },
  'udawalawe': { x: 180, y: 330 },
  'hikkaduwa': { x: 80, y: 360 },
  'tangalle': { x: 160, y: 390 },
  'weligama': { x: 130, y: 390 },
  'kataragama': { x: 210, y: 350 },
  'matara': { x: 140, y: 390 },
  'habarana': { x: 160, y: 190 }
};

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('articles');
  const [loading, setLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Published content
  const [publishedArticles, setPublishedArticles] = useState([]);
  const [publishedReviews, setPublishedReviews] = useState([]);
  const [publishedItineraries, setPublishedItineraries] = useState([]);
  const [publishedCategories, setPublishedCategories] = useState([]);
  const [publishedHotels, setPublishedHotels] = useState([]);
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [hotelForm, setHotelForm] = useState({
    name: '', stars: 5, location: '', description: '', image: '', category: '',
    amenities: [],
    extendedAmenities: { popular: [], categories: [] },
    categorizedGallery: []
  });

  const [contentLoading, setContentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit mode
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingItineraryId, setEditingItineraryId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // Form States
  const [itineraryForm, setItineraryForm] = useState({
    title: '',
    description: '',
    image: '',
    price: '',
    duration: '',
    group: 'Private',
    effort: 'Moderate',
    category: 'Popular',
    icons: '5 Star, Half Board, Car',
    seo_title: '',
    seo_description: '',
    seo_keywords: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    title: '',
    slug: '',
    image: ''
  });

  const [itineraryDays, setItineraryDays] = useState([
    { id: 1, location: '', image: '', description: '', highlights: '', accommodation: '', accommodationImages: ['', '', '', ''], meals: 'Breakfast & Dinner', travel: '', coords: { x: 150, y: 225 } }
  ]);

  const [articleForm, setArticleForm] = useState({
    title: '',
    description: '',
    category: 'History',
    excerpt: '',
    image: '',
    author: 'Eden Travels',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase(),
    seo_title: '',
    seo_description: '',
    seo_keywords: ''
  });

  const [contentBlocks, setContentBlocks] = useState([{ type: 'paragraph', text: '' }]);

  // Review Form State
  const [reviewForm, setReviewForm] = useState({
    name: '',
    date: '', // Display date (e.g. Feb 2024)
    text: '', // Short snippet
    img: '', // Main hero image
    rating: 5,
    headline: '',
    detailedtext: '',
    gallery: ['', '', '', ''], // 4 gallery slots
    tourdetails: {
      date: '',
      travelertype: 'Couple',
      group: 'Private'
    },
    guide: {
      name: 'Hasindu',
      photo: '',
      rating: 5,
      quote: ''
    }
  });

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'eden2024') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect Password');
    }
  };

  const fetchContent = async () => {
    setContentLoading(true);
    const [articles, reviews, itineraries, categories, hotels] = await Promise.all([
      getArticles(), 
      getReviews(), 
      getItineraries(),
      getCategories(),
      getHotels()
    ]);
    setPublishedArticles(articles);
    setPublishedReviews(reviews);
    setPublishedItineraries(itineraries);
    setPublishedCategories(categories);
    setPublishedHotels(hotels);
    setContentLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) fetchContent();
  }, [isAuthenticated]);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const translateText = async (text, sl = 'en', tl = 'de', retries = 2) => {
    if (!text || typeof text !== 'string') return text;
    try {
      const response = await fetch('http://localhost:5000/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_lang: tl })
      });
      if (!response.ok) throw new Error('Translation failed');
      const data = await response.json();
      return data.translations[0].text;
    } catch (e) {
      if (retries > 0) {
        await sleep(1000);
        return translateText(text, sl, tl, retries - 1);
      }
      console.error("Translation error", e);
      return text;
    }
  };

  const extractStrings = (obj) => {
    let strings = [];
    if (typeof obj === 'string') return [obj];
    if (Array.isArray(obj)) {
      obj.forEach(item => strings.push(...extractStrings(item)));
    } else if (typeof obj === 'object' && obj !== null) {
      Object.values(obj).forEach(val => strings.push(...extractStrings(val)));
    }
    return strings;
  };

  const rebuildObject = (obj, translatedStrings, state = { index: 0 }) => {
    if (typeof obj === 'string') return translatedStrings[state.index++];
    if (Array.isArray(obj)) {
      return obj.map(item => rebuildObject(item, translatedStrings, state));
    } else if (typeof obj === 'object' && obj !== null) {
      const newObj = {};
      Object.keys(obj).forEach(key => {
        newObj[key] = rebuildObject(obj[key], translatedStrings, state);
      });
      return newObj;
    }
    return obj;
  };

  const translateObject = async (obj, sl = 'en', tl = 'de', retries = 2) => {
    try {
      const texts = extractStrings(obj);
      if (!texts.length) return obj;

      const response = await fetch('http://localhost:5000/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: texts, target_lang: tl })
      });
      if (!response.ok) throw new Error('Translation failed');
      const data = await response.json();
      
      const translatedTexts = data.translations.map(t => t.text);
      if (translatedTexts.length !== texts.length) {
         throw new Error("Translation array length mismatch");
      }
      
      return rebuildObject(obj, translatedTexts);
    } catch (e) {
      if (retries > 0) {
        console.warn("Translation failed, retrying...", e);
        await sleep(2000);
        return translateObject(obj, sl, tl, retries - 1);
      }
      console.error("Translation error", e);
      return obj;
    }
  };

  const handleTranslateAndPublishArticle = async () => {
    setIsTranslating(true);
    setLoading(true);
    try {
      const frData = {
        ...articleForm,
        content: contentBlocks.filter(b => b.text.trim() !== ''),
        tags: articleForm.category ? [`#${articleForm.category.replace(/\s+/g, '')}`] : []
      };
      
      let newFrId = editingArticleId;
      if (editingArticleId) {
        await updateArticle(editingArticleId, frData);
      } else {
        newFrId = await addArticle(frData);
      }

      const deData = { ...frData, id: newFrId };
      deData.title = await translateText(frData.title);
      deData.description = await translateText(frData.description);
      deData.excerpt = await translateText(frData.excerpt);
      deData.seo_title = await translateText(frData.seo_title);
      deData.seo_description = await translateText(frData.seo_description);
      deData.seo_keywords = await translateText(frData.seo_keywords);
      
      deData.content = await Promise.all(frData.content.map(async (block) => {
        if (block.type !== 'image' && block.text) {
          return { ...block, text: await translateText(block.text) };
        }
        return block;
      }));

      const { error: err } = await supabase.from('articles_de').upsert(deData);
      if (err) throw err;

      setMessage({ type: 'success', text: 'Article publié en FR et traduit/publié en DE !' });
      resetArticleForm();
      fetchContent();
      setActiveTab('articles');
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: `Erreur: ${e.message}` });
    }
    setLoading(false);
    setIsTranslating(false);
  };

  const handleTranslateAndPublishReview = async () => {
    setIsTranslating(true);
    setLoading(true);
    try {
      let newFrId = editingReviewId;
      if (editingReviewId) {
        await updateReview(editingReviewId, reviewForm);
      } else {
        newFrId = await addReview(reviewForm);
      }

      const deForm = { ...reviewForm, id: newFrId };
      deForm.headline = await translateText(reviewForm.headline);
      deForm.text = await translateText(reviewForm.text);
      deForm.detailedtext = await translateText(reviewForm.detailedtext);
      deForm.tourdetails.travelertype = await translateText(reviewForm.tourdetails.travelertype);
      deForm.tourdetails.group = await translateText(reviewForm.tourdetails.group);
      deForm.guide.quote = await translateText(reviewForm.guide.quote);

      const { error: err } = await supabase.from('reviews_de').upsert(deForm);
      if (err) throw err;

      setMessage({ type: 'success', text: 'Avis publié en FR et traduit/publié en DE !' });
      resetReviewForm();
      fetchContent();
      setActiveTab('reviews');
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: `Erreur: ${e.message}` });
    }
    setLoading(false);
    setIsTranslating(false);
  };

  const handleTranslateAndPublishItinerary = async () => {
    setIsTranslating(true);
    setLoading(true);
    try {
      const frData = { 
        ...itineraryForm, 
        days: itineraryDays,
        icons: (itineraryForm.icons || '').split(',').map(i => i.trim()).filter(i => i !== '')
      };
      
      let newFrId = editingItineraryId;
      if (editingItineraryId) {
        await updateItinerary(editingItineraryId, frData);
      } else {
        newFrId = await addItinerary(frData);
      }

      const translateItinerarySeq = async (sourceData, sl, tl) => {
        const result = {
          ...sourceData,
          title: await translateText(sourceData.title, sl, tl),
          description: await translateText(sourceData.description, sl, tl),
          effort: await translateText(sourceData.effort, sl, tl),
          group: await translateText(sourceData.group, sl, tl),
          seo_title: await translateText(sourceData.seo_title, sl, tl),
          seo_description: await translateText(sourceData.seo_description, sl, tl),
          seo_keywords: await translateText(sourceData.seo_keywords, sl, tl),
          days: []
        };
        for (const day of sourceData.days || []) {
          result.days.push({
            ...day,
            location: await translateText(day.location, sl, tl),
            description: await translateText(day.description, sl, tl),
            highlights: await translateText(day.highlights, sl, tl),
            accommodation: await translateText(day.accommodation, sl, tl),
            meals: await translateText(day.meals, sl, tl),
            travel: await translateText(day.travel, sl, tl),
            displayLabel: await translateText(day.displayLabel, sl, tl)
          });
        }
        return result;
      };

      const deData = await translateItinerarySeq(frData, 'fr', 'de');
      deData.id = newFrId;
      await supabase.from('itineraries_de').upsert(deData);

      const enData = await translateItinerarySeq(frData, 'fr', 'en');
      enData.id = newFrId;
      await supabase.from('itineraries_en').upsert(enData);

      const itData = await translateItinerarySeq(frData, 'fr', 'it');
      itData.id = newFrId;
      await supabase.from('itineraries_it').upsert(itData);

      const esData = await translateItinerarySeq(frData, 'fr', 'es');
      esData.id = newFrId;
      await supabase.from('itineraries_es').upsert(esData);

      setMessage({ type: 'success', text: 'Itinéraire publié en FR et traduit/publié en toutes les langues !' });
      resetItineraryForm();
      fetchContent();
      setActiveTab('itineraries');
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: `Erreur: ${e.message}` });
    }
    setLoading(false);
    setIsTranslating(false);
  };

  const resetArticleForm = () => {
    setArticleForm({ 
      title: '', 
      description: '', 
      category: 'History', 
      excerpt: '', 
      image: '', 
      author: 'Eden Travels', 
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase(),
      seo_title: '',
      seo_description: '',
      seo_keywords: ''
    });
    setContentBlocks([{ type: 'paragraph', text: '' }]);
    setEditingArticleId(null);
  };

  const autoGenerateArticleSEO = () => {
    if (!articleForm.title) return alert("Please enter a title first");
    setArticleForm({
      ...articleForm,
      seo_title: `${articleForm.title} | Eden Travels`,
      seo_description: articleForm.excerpt || articleForm.description.substring(0, 155),
      seo_keywords: `${articleForm.category.toLowerCase()}, sri lanka, travel guide, ${articleForm.title.toLowerCase().replace(/ /g, ', ')}`
    });
  };

  const resetReviewForm = () => {
    setReviewForm({
      name: '',
      date: '',
      text: '',
      img: '',
      rating: 5,
      headline: '',
      detailedtext: '',
      gallery: ['', '', '', ''],
      tourdetails: {
        date: '',
        travelertype: 'Couple',
        group: 'Private'
      },
      guide: {
        name: 'Hasindu',
        photo: '',
        rating: 5,
        quote: ''
      }
    });
    setEditingReviewId(null);
  };

  const resetItineraryForm = () => {
    setItineraryForm({ 
      title: '', 
      description: '', 
      image: '', 
      price: '', 
      duration: '', 
      group: 'Private', 
      effort: 'Moderate', 
      category: 'Popular', 
      icons: '5 Star, Half Board, Car',
      seo_title: '',
      seo_description: '',
      seo_keywords: ''
    });
    setItineraryDays([{ id: 1, location: '', image: '', description: '', highlights: '', accommodation: '', accommodationImages: ['', '', '', ''], meals: 'Breakfast & Dinner', travel: '', coords: { x: 150, y: 225 } }]);
    setEditingItineraryId(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({ title: '', slug: '', image: '' });
    setEditingCategoryId(null);
  };

  const autoGenerateItinerarySEO = () => {
    if (!itineraryForm.title) return alert("Please enter a title first");
    setItineraryForm({
      ...itineraryForm,
      seo_title: `${itineraryForm.title} | Luxury Sri Lanka Tours`,
      seo_description: itineraryForm.description.substring(0, 155),
      seo_keywords: `${itineraryForm.category.toLowerCase()}, luxury tours, sri lanka, itinerary, ${itineraryForm.title.toLowerCase().replace(/ /g, ', ')}`
    });
  };

  const handleEditArticle = (article) => {
    setArticleForm({
      title: article.title || '',
      description: article.description || '',
      category: article.category || 'History',
      excerpt: article.excerpt || '',
      image: article.image || '',
      author: article.author || 'Eden Travels',
      date: article.date || '',
      seo_title: article.seo_title || '',
      seo_description: article.seo_description || '',
      seo_keywords: article.seo_keywords || ''
    });
    setContentBlocks(article.content && article.content.length > 0 ? article.content : [{ type: 'paragraph', text: '' }]);
    setEditingArticleId(article.id);
    setActiveTab('new-article');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditReview = (review) => {
    setReviewForm({
      name: review.name || '',
      date: review.date || '',
      text: review.text || '',
      img: review.img || '',
      rating: review.rating || 5,
      headline: review.headline || '',
      detailedtext: '',
      gallery: ['', '', '', ''],
      tourdetails: review.tourdetails || { date: '', travelertype: 'Couple', group: 'Private' },
      guide: review.guide || { name: 'Hasindu', photo: '', rating: 5, quote: '' }
    });
    setEditingReviewId(review.id);
    setActiveTab('new-review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditItinerary = (itinerary) => {
    setItineraryForm({
      title: itinerary.title || '',
      description: itinerary.description || '',
      image: itinerary.image || '',
      price: itinerary.price || '',
      duration: itinerary.duration || '',
      group: itinerary.group || 'Private',
      effort: itinerary.effort || 'Moderate',
      category: itinerary.category || 'Popular',
      icons: Array.isArray(itinerary.icons) ? itinerary.icons.join(', ') : (itinerary.icons || '5 Star, Half Board, Car'),
      seo_title: itinerary.seo_title || '',
      seo_description: itinerary.seo_description || '',
      seo_keywords: itinerary.seo_keywords || ''
    });
    setItineraryDays(itinerary.days?.map(d => ({...d, accommodationImages: d.accommodationImages || ['', '', '', '']})) || [{ id: 1, location: '', image: '', description: '', highlights: '', accommodation: '', accommodationImages: ['', '', '', ''], meals: 'Breakfast & Dinner', travel: '', coords: { x: 150, y: 225 } }]);
    setEditingItineraryId(itinerary.id);
    setActiveTab('new-itinerary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditCategory = (category) => {
    setCategoryForm({
      title: category.title || '',
      slug: category.slug || '',
      image: category.image || ''
    });
    setEditingCategoryId(category.id);
    setActiveTab('new-category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await deleteArticle(id);
      setMessage({ type: 'success', text: 'Article deleted!' });
      fetchContent();
    } catch (e) {
      setMessage({ type: 'error', text: `Delete failed: ${e.message}` });
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteReview(id);
      setMessage({ type: 'success', text: 'Review deleted!' });
      fetchContent();
    } catch (e) {
      setMessage({ type: 'error', text: `Delete failed: ${e.message}` });
    }
  };

  const handleDeleteItinerary = async (id) => {
    if (!window.confirm('Are you sure you want to delete this itinerary?')) return;
    try {
      await deleteItinerary(id);
      setMessage({ type: 'success', text: 'Itinerary deleted!' });
      fetchContent();
    } catch (e) {
      setMessage({ type: 'error', text: `Delete failed: ${e.message}` });
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(id);
      setMessage({ type: 'success', text: 'Category deleted!' });
      fetchContent();
    } catch (e) {
      setMessage({ type: 'error', text: `Delete failed: ${e.message}` });
    }
  };

  const handleEnglishToBothArticle = async () => {
    if (!articleForm.title) {
      setMessage({ type: 'error', text: 'Titre requis.' });
      return;
    }
    setLoading(true);
    setIsTranslating(true);
    setMessage({ type: '', text: '' });
    try {
      // Helper function for translating article
      const translateArticle = async (sl, tl) => {
        const dataToTranslate = {
          title: articleForm.title,
          description: articleForm.description,
          excerpt: articleForm.excerpt,
          seo_title: articleForm.seo_title,
          seo_description: articleForm.seo_description,
          seo_keywords: articleForm.seo_keywords,
          content: contentBlocks.map(block => (block.type !== 'image' && block.text) ? block.text : '')
        };
        const translatedData = await translateObject(dataToTranslate, sl, tl);

        const translatedContent = contentBlocks.map((block, idx) => {
          if (block.type !== 'image' && block.text) {
             return { ...block, text: translatedData.content?.[idx] || block.text };
          }
          return block;
        }).filter(b => b.text && b.text.trim() !== '');

        return {
          ...articleForm,
          title: translatedData.title || articleForm.title,
          description: translatedData.description || articleForm.description,
          excerpt: translatedData.excerpt || articleForm.excerpt,
          seo_title: translatedData.seo_title || articleForm.seo_title,
          seo_description: translatedData.seo_description || articleForm.seo_description,
          seo_keywords: translatedData.seo_keywords || articleForm.seo_keywords,
          content: translatedContent,
          tags: articleForm.category ? [`#${articleForm.category.replace(/\s+/g, '')}`] : []
        };
      };

      // 1. FR Database
      const frData = await translateArticle('auto', 'fr');
      let newFrId = editingArticleId;
      if (editingArticleId) {
        await updateArticle(editingArticleId, frData);
      } else {
        newFrId = await addArticle(frData);
      }

      // 2. DE Database
      const deData = await translateArticle('auto', 'de');
      deData.id = newFrId;
      await supabase.from('articles_de').upsert(deData);

      // 3. IT Database
      const itData = await translateArticle('auto', 'it');
      itData.id = newFrId;
      await supabase.from('articles_it').upsert(itData);

      // 4. ES Database
      const esData = await translateArticle('auto', 'es');
      esData.id = newFrId;
      await supabase.from('articles_es').upsert(esData);

      // 5. EN Database
      const enData = await translateArticle('auto', 'en');
      enData.id = newFrId;
      await supabase.from('articles_en').upsert(enData);

      setMessage({ type: 'success', text: 'Article publié en FR et DE depuis l\'Anglais !' });
      resetArticleForm();
      fetchContent();
      setActiveTab('articles');
    } catch (error) {
      console.error("Translation/Publish error:", error);
      setMessage({ type: 'error', text: `Erreur: ${error.message}` });
    } finally {
      setLoading(false);
      setIsTranslating(false);
    }
  };

  const handleEnglishToBothReview = async () => {
    if (!reviewForm.name) {
      setMessage({ type: 'error', text: 'Name required.' });
      return;
    }
    setLoading(true);
    setIsTranslating(true);
    setMessage({ type: '', text: 'Translating and Publishing...' });
    try {
      const baseData = { ...reviewForm };

      // Helper function for translating review specific fields
      const translateReview = async (sl, tl) => {
        const dataToTranslate = {
          headline: reviewForm.headline,
          text: reviewForm.text,
          detailedtext: reviewForm.detailedtext,
          tourdetails: {
            travelertype: reviewForm.tourdetails.travelertype,
            group: reviewForm.tourdetails.group
          },
          guide: {
            quote: reviewForm.guide.quote
          }
        };
        const translatedData = await translateObject(dataToTranslate, sl, tl);

        return {
          ...baseData,
          headline: translatedData.headline || reviewForm.headline,
          text: translatedData.text || reviewForm.text,
          detailedtext: translatedData.detailedtext || reviewForm.detailedtext,
          tourdetails: {
            ...reviewForm.tourdetails,
            travelertype: translatedData.tourdetails?.travelertype || reviewForm.tourdetails.travelertype,
            group: translatedData.tourdetails?.group || reviewForm.tourdetails.group
          },
          guide: {
            ...reviewForm.guide,
            quote: translatedData.guide?.quote || reviewForm.guide.quote
          }
        };
      };

      // 1. FR Database (base table)
      const frForm = await translateReview('auto', 'fr');
      let newId = editingReviewId;
      if (editingReviewId) {
        await updateReview(editingReviewId, frForm);
      } else {
        newId = await addReview(frForm);
      }

      // 2. EN Database
      const enForm = await translateReview('auto', 'en');
      enForm.id = newId;
      await supabase.from('reviews_en').upsert(enForm);

      // 3. DE Database
      const deForm = await translateReview('auto', 'de');
      deForm.id = newId;
      await supabase.from('reviews_de').upsert(deForm);

      // 4. IT Database
      const itForm = await translateReview('auto', 'it');
      itForm.id = newId;
      await supabase.from('reviews_it').upsert(itForm);

      // 5. ES Database
      const esForm = await translateReview('auto', 'es');
      esForm.id = newId;
      await supabase.from('reviews_es').upsert(esForm);

      setMessage({ type: 'success', text: 'Avis publié en toutes les langues depuis l\'Anglais !' });
      resetReviewForm();
      fetchContent();
      setActiveTab('reviews');
    } catch (error) {
      console.error("Translation/Publish error:", error);
      setMessage({ type: 'error', text: `Erreur: ${error.message}` });
    } finally {
      setLoading(false);
      setIsTranslating(false);
    }
  };

  const handleEnglishToBothItinerary = async () => {
    if (!itineraryForm.title) return;
    setLoading(true);
    setIsTranslating(true);
    setMessage({ type: '', text: 'Translating and Publishing...' });
    try {
      const baseData = { 
        ...itineraryForm,
        icons: (itineraryForm.icons || '').split(',').map(i => i.trim()).filter(i => i !== '') 
      };

      const translateItinerary = async (sl, tl) => {
        // Send the entire object to Gemini in one request to save Rate Limits
        const dataToTranslate = {
          title: itineraryForm.title,
          description: itineraryForm.description,
          effort: itineraryForm.effort,
          group: itineraryForm.group,
          seo_title: itineraryForm.seo_title,
          seo_description: itineraryForm.seo_description,
          seo_keywords: itineraryForm.seo_keywords,
          days: itineraryDays.map(day => ({
            location: day.location,
            description: day.description,
            highlights: day.highlights,
            accommodation: day.accommodation,
            meals: day.meals,
            travel: day.travel,
            displayLabel: day.displayLabel
          }))
        };
        
        const translatedData = await translateObject(dataToTranslate, sl, tl);
        
        // Merge translated data with original structure
        const result = { ...baseData, ...translatedData, days: [] };
        
        for (let i = 0; i < itineraryDays.length; i++) {
          result.days.push({
            ...itineraryDays[i],
            ...(translatedData.days && translatedData.days[i] ? translatedData.days[i] : {})
          });
        }
        return result;
      };

      // 1. FR Database (base table)
      const frData = await translateItinerary('auto', 'fr');
      let newId = editingItineraryId;
      if (editingItineraryId) {
        await updateItinerary(editingItineraryId, frData);
      } else {
        newId = await addItinerary(frData);
      }

      // 2. EN Database
      const enData = await translateItinerary('auto', 'en');
      enData.id = newId;
      await supabase.from('itineraries_en').upsert(enData);

      // 3. DE Database
      const deData = await translateItinerary('auto', 'de');
      deData.id = newId;
      await supabase.from('itineraries_de').upsert(deData);

      // 4. IT Database
      const itData = await translateItinerary('auto', 'it');
      itData.id = newId;
      await supabase.from('itineraries_it').upsert(itData);

      // 5. ES Database
      const esData = await translateItinerary('auto', 'es');
      esData.id = newId;
      await supabase.from('itineraries_es').upsert(esData);

      setMessage({ type: 'success', text: 'Itinéraire publié en toutes les langues depuis l\'Anglais !' });
      resetItineraryForm();
      fetchContent();
      setActiveTab('itineraries');
    } catch (error) {
      console.error("Translation/Publish error:", error);
      setMessage({ type: 'error', text: `Erreur: ${error.message}` });
    } finally {
      setLoading(false);
      setIsTranslating(false);
    }
  };

  
  const resetHotelForm = () => {
    setHotelForm({
      name: '', stars: 5, location: '', description: '', image: '', category: '',
      amenities: [], extendedAmenities: { popular: [], categories: [] }, categorizedGallery: []
    });
    setEditingHotelId(null);
  };

  const handleEditHotel = (hotel) => {
    setHotelForm({
      name: hotel.name || '', stars: hotel.stars || 5, location: hotel.location || '',
      description: hotel.description || '', image: hotel.image || '', category: hotel.category || 'exclusive',
      amenities: hotel.amenities || [], extendedAmenities: hotel.extended_amenities || { popular: [], categories: [] },
      categorizedGallery: hotel.categorized_gallery || []
    });
    setEditingHotelId(hotel.id);
    setActiveTab('new-hotel');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHotel = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hotel?')) return;
    try {
      await deleteHotel(id);
      setMessage({ type: 'success', text: 'Hotel deleted!' });
      fetchContent();
    } catch (e) {
      setMessage({ type: 'error', text: `Delete failed: ${e.message}` });
    }
  };

  const handleSpanishToBothHotel = async () => {
    if (!hotelForm.name) return setMessage({ type: 'error', text: 'Hotel Name required.' });
    setLoading(true); setIsTranslating(true); setMessage({ type: '', text: 'Translating...' });
    try {
      const baseData = {
        image: hotelForm.image, stars: hotelForm.stars, category: hotelForm.category,
        amenities: hotelForm.amenities, categorized_gallery: hotelForm.categorizedGallery
      };
      
      const autoPopular = hotelForm.extendedAmenities.categories
        .filter(cat => cat.title && cat.title.trim() !== '')
        .map(cat => ({ icon: cat.icon, label: cat.title }));
        
      const combinedExtendedAmenities = {
        popular: autoPopular,
        categories: hotelForm.extendedAmenities.categories
      };

      const translateAmenities = async (sl, tl) => {
        const translatedCategories = await Promise.all(hotelForm.extendedAmenities.categories.map(async (cat) => ({
          icon: cat.icon,
          title: await translateText(cat.title, sl, tl),
          items: await Promise.all(cat.items.map(async (item) => await translateText(item, sl, tl)))
        })));
        return {
          popular: translatedCategories.filter(cat => cat.title && cat.title.trim() !== '').map(cat => ({ icon: cat.icon, label: cat.title })),
          categories: translatedCategories
        };
      };

      // FR (base table 'hotels')
      const frData = {
        name: hotelForm.name,
        location: hotelForm.location,
        description: await translateText(hotelForm.description, 'auto', 'fr'),
        stars: hotelForm.stars,
        category: hotelForm.category,
        image: hotelForm.image,
        amenities: hotelForm.amenities,
        extended_amenities: await translateAmenities('auto', 'fr'),
        categorized_gallery: hotelForm.categorizedGallery
      };

      // EN
      const enData = { ...baseData, name: hotelForm.name, location: hotelForm.location, description: await translateText(hotelForm.description, 'auto', 'en') };
      enData.extended_amenities = await translateAmenities('auto', 'en');
      
      // DE
      const deData = { ...baseData, name: hotelForm.name, location: hotelForm.location, description: await translateText(hotelForm.description, 'auto', 'de') };
      deData.extended_amenities = await translateAmenities('auto', 'de');
      
      // IT
      const itData = { ...baseData, name: hotelForm.name, location: hotelForm.location, description: await translateText(hotelForm.description, 'auto', 'it') };
      itData.extended_amenities = await translateAmenities('auto', 'it');
      
      // ES
      const esData = { ...baseData, name: hotelForm.name, location: hotelForm.location, description: hotelForm.description };
      esData.extended_amenities = combinedExtendedAmenities;

      let newId = editingHotelId;
      if (editingHotelId) { await updateHotel(editingHotelId, frData); }
      else { newId = await addHotel(frData); }
      
      await supabase.from('hotels_en').upsert({...enData, id: newId});
      await supabase.from('hotels_de').upsert({...deData, id: newId});
      await supabase.from('hotels_it').upsert({...itData, id: newId});
      await supabase.from('hotels_es').upsert({...esData, id: newId});
      
      setMessage({ type: 'success', text: 'Hotel published!' });
      resetHotelForm();
      fetchContent();
      setActiveTab('hotels');
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setLoading(false); setIsTranslating(false);
    }
  };
  
  const handleHotelSubmit = async (e) => { e.preventDefault(); await handleSpanishToBothHotel(); };

  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    if (!articleForm.title) return setMessage({ type: 'error', text: 'Article Title required.' });
    setLoading(true); setIsTranslating(true); setMessage({ type: '', text: 'Translating and Publishing to all languages...' });
    try {
      const data = {
        ...articleForm,
        content: contentBlocks.filter(b => b.text.trim() !== ''),
        tags: articleForm.category ? [`#${articleForm.category.replace(/\s+/g, '')}`] : []
      };

      const translateContent = async (blocks, tl) => {
        return await Promise.all(blocks.map(async (block) => {
          if (block.type !== 'image' && block.text) {
            return { ...block, text: await translateText(block.text, 'auto', tl) };
          }
          return block;
        }));
      };

      const baseData = {
        image: articleForm.image,
        category: articleForm.category,
        author: articleForm.author,
        date: articleForm.date,
        tags: data.tags
      };

      const translateFullData = async (tl) => ({
        ...baseData,
        title: await translateText(articleForm.title, 'auto', tl),
        description: await translateText(articleForm.description, 'auto', tl),
        excerpt: await translateText(articleForm.excerpt, 'auto', tl),
        seo_title: await translateText(articleForm.seo_title, 'auto', tl),
        seo_description: await translateText(articleForm.seo_description, 'auto', tl),
        seo_keywords: await translateText(articleForm.seo_keywords, 'auto', tl),
        content: await translateContent(data.content, tl)
      });

      const frData = await translateFullData('fr');
      const enData = await translateFullData('en');
      const deData = await translateFullData('de');
      const itData = await translateFullData('it');
      const esData = await translateFullData('es');

      let newId = editingArticleId;
      if (editingArticleId) {
        await updateArticle(editingArticleId, frData);
        setMessage({ type: 'success', text: 'Article updated & translated to all languages!' });
      } else {
        newId = await addArticle(frData);
        setMessage({ type: 'success', text: 'Article published & translated to all languages!' });
      }

      await supabase.from('articles_en').upsert({...enData, id: newId});
      await supabase.from('articles_de').upsert({...deData, id: newId});
      await supabase.from('articles_it').upsert({...itData, id: newId});
      await supabase.from('articles_es').upsert({...esData, id: newId});

      resetArticleForm();
      fetchContent();
      setActiveTab('articles');
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Failed: ${error.message}` });
    }
    setLoading(false); setIsTranslating(false);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    await handleEnglishToBothReview();
  };

  const handleItinerarySubmit = async (e) => {
    e.preventDefault();
    await handleEnglishToBothItinerary();
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, categoryForm);
        setMessage({ type: 'success', text: 'Category updated successfully!' });
      } else {
        await addCategory(categoryForm);
        setMessage({ type: 'success', text: 'Category added successfully!' });
      }
      resetCategoryForm();
      fetchContent();
      setActiveTab('interests');
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Failed: ${error.message}` });
    }
    setLoading(false);
  };

  const addBlock = (type, index = null) => {
    if (index === null) {
      setContentBlocks([...contentBlocks, { type, text: '' }]);
    } else {
      const b = [...contentBlocks];
      b.splice(index + 1, 0, { type, text: '' });
      setContentBlocks(b);
    }
  };
  const updateBlock = (index, text) => { const b = [...contentBlocks]; b[index].text = text; setContentBlocks(b); };
  const removeBlock = (index) => setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  const moveBlock = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === contentBlocks.length - 1) return;
    const b = [...contentBlocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = b[index];
    b[index] = b[targetIndex];
    b[targetIndex] = temp;
    setContentBlocks(b);
  };

  const loginInputClass = "w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/20 transition-all";

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-primary text-3xl font-bold font-serif">Admin Access</h1>
            <p className="text-gray-500 text-sm mt-2">Eden Travels Content Manager</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Secret Key</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={loginInputClass} placeholder="Enter password..." />
            </div>
            <button className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-primary/90 transition-all">Login to Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'articles', label: 'Articles', icon: '📄', count: publishedArticles.length },
    { id: 'reviews', label: 'Reviews', icon: '⭐', count: publishedReviews.length },
    { id: 'itineraries', label: 'Itineraries', icon: '🗺️', count: publishedItineraries.length },
    { id: 'new-article', label: editingArticleId ? 'Edit Article' : 'New Article', icon: '✍️' },
    { id: 'new-review', label: editingReviewId ? 'Edit Review' : 'New Review', icon: '✨' },
    { id: 'new-itinerary', label: editingItineraryId ? 'Edit Itinerary' : 'New Itinerary', icon: '📍' },
    { id: 'hotels', label: 'Hotels', icon: '🏨', count: publishedHotels.length },
    { id: 'new-hotel', label: editingHotelId ? 'Edit Hotel' : 'New Hotel', icon: '➕' },
  ];

  const inputClass = "w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-primary font-medium placeholder:text-gray-300 shadow-sm";
  const labelClass = "text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block";

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex font-sans text-primary">
      {/* Sidebar */}
      <aside className="w-80 bg-primary h-screen sticky top-0 flex flex-col shadow-2xl z-50">
        <div className="p-10">
          <div className="mb-12">
            <h1 className="text-white text-3xl font-serif font-bold tracking-tight">Eden</h1>
            <p className="text-luxury text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Management</p>
          </div>

          <nav className="space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { 
                  setActiveTab(tab.id); 
                  setSearchQuery('');
                  if (tab.id === 'new-article' && !editingArticleId) resetArticleForm(); 
                  if (tab.id === 'new-review' && !editingReviewId) resetReviewForm(); 
                  if (tab.id === 'new-itinerary' && !editingItineraryId) resetItineraryForm();
                  if (tab.id === 'new-category' && !editingCategoryId) resetCategoryForm();
                }}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group ${activeTab === tab.id ? 'bg-white text-primary shadow-xl scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-xl transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'opacity-100' : 'opacity-50'}`}>{tab.icon}</span>
                  <span className="font-bold text-sm tracking-wide">{tab.label}</span>
                </div>
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-white/10 text-white/40'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-10 border-t border-white/5">
          <a href="/" className="flex items-center gap-3 text-white/50 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
            <span className="text-lg">←</span> View Website
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-12 py-12">
        {/* Top Header */}
        <header className="flex items-center justify-between mb-12 bg-white/50 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-sm">
          <div>
            <h2 className="text-3xl font-serif font-bold text-primary">Dashboard</h2>
            <p className="text-gray-400 text-sm font-medium">Welcome back, Admin</p>
          </div>
          <div className="flex items-center gap-4">
            {message.text && (
              <div className={`px-6 py-3 rounded-2xl font-bold text-sm animate-fade-in ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {message.text}
                <button onClick={() => setMessage({ type: '', text: '' })} className="ml-4 hover:scale-110 transition-transform">×</button>
              </div>
            )}
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">ET</div>
          </div>
        </header>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto">
          {/* ARTICLES LIST */}
          {activeTab === 'articles' && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 px-4 gap-4">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-primary mb-1">Travel Guides</h3>
                  <p className="text-gray-400 text-sm font-medium">Manage your blog articles and guides</p>
                </div>
                <div className="flex flex-1 w-full md:w-auto max-w-md gap-4">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input 
                      type="text" 
                      placeholder="Search articles..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-6 outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm font-medium shadow-sm"
                    />
                  </div>
                  <button onClick={() => { resetArticleForm(); setActiveTab('new-article'); }} className="bg-primary text-white font-bold px-8 py-3 rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 text-sm tracking-wide whitespace-nowrap">+ NEW ARTICLE</button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {contentLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Syncing with database...</p>
                  </div>
                ) : publishedArticles.filter(article => 
                    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    article.category.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 ? (
                  <div className="bg-white rounded-[40px] p-24 text-center border border-gray-100 shadow-sm">
                    <div className="text-6xl mb-6">{searchQuery ? '🔎' : '📭'}</div>
                    <h4 className="text-xl font-bold text-primary mb-2">{searchQuery ? 'No matching articles' : 'No articles found'}</h4>
                    <p className="text-gray-400 max-w-xs mx-auto mb-8">
                      {searchQuery ? `We couldn't find any articles matching "${searchQuery}"` : 'Start sharing your travel stories with the world.'}
                    </p>
                    {searchQuery ? (
                      <button onClick={() => setSearchQuery('')} className="text-primary font-bold hover:underline">Clear search filter</button>
                    ) : (
                      <button onClick={() => setActiveTab('new-article')} className="text-primary font-bold hover:underline">Create your first guide →</button>
                    )}
                  </div>
                ) : publishedArticles
                    .filter(article => 
                      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      article.category.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((article) => (
                  <div key={article.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex gap-8 items-center group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-inner">
                      {article.image && <img src={article.image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-bold text-luxury bg-luxury/10 px-2 py-0.5 rounded-full uppercase tracking-widest">{article.category}</span>
                        <span className="text-gray-300 text-xs font-bold">{article.date}</span>
                      </div>
                      <h3 className="text-primary font-bold text-xl leading-tight truncate mb-1">{article.title}</h3>
                      <p className="text-gray-400 text-sm truncate font-medium">{article.excerpt}</p>
                    </div>
                    <div className="flex gap-3 flex-shrink-0 pr-4">
                      <button onClick={() => handleEditArticle(article)} className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-primary hover:text-white text-gray-400 rounded-2xl transition-all duration-300">✏️</button>
                      <button onClick={() => handleDeleteArticle(article.id)} className="w-12 h-12 flex items-center justify-center bg-red-50 hover:bg-red-500 hover:text-white text-red-400 rounded-2xl transition-all duration-300">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REVIEWS LIST */}
          {activeTab === 'reviews' && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 px-4 gap-4">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-primary mb-1">Guest Reviews</h3>
                  <p className="text-gray-400 text-sm font-medium">Manage feedback and client testimonials</p>
                </div>
                <div className="flex flex-1 w-full md:w-auto max-w-md gap-4">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input 
                      type="text" 
                      placeholder="Search reviews by guest name..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-6 outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm font-medium shadow-sm"
                    />
                  </div>
                  <button onClick={() => { resetReviewForm(); setActiveTab('new-review'); }} className="bg-primary text-white font-bold px-8 py-3 rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 text-sm tracking-wide whitespace-nowrap">+ NEW REVIEW</button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {contentLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Updating reviews...</p>
                  </div>
                ) : publishedReviews.filter(review => 
                    review.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (review.headline && review.headline.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).length === 0 ? (
                  <div className="bg-white rounded-[40px] p-24 text-center border border-gray-100 shadow-sm">
                    <div className="text-6xl mb-6">{searchQuery ? '🔎' : '✨'}</div>
                    <h4 className="text-xl font-bold text-primary mb-2">{searchQuery ? 'No matching reviews' : 'No reviews yet'}</h4>
                    <p className="text-gray-400 max-w-xs mx-auto mb-8">
                      {searchQuery ? `We couldn't find any reviews matching "${searchQuery}"` : 'Gather feedback from your happy travelers.'}
                    </p>
                    {searchQuery ? (
                      <button onClick={() => setSearchQuery('')} className="text-primary font-bold hover:underline">Clear search filter</button>
                    ) : (
                      <button onClick={() => setActiveTab('new-review')} className="text-primary font-bold hover:underline">Add your first story →</button>
                    )}
                  </div>
                ) : publishedReviews
                    .filter(review => 
                      review.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (review.headline && review.headline.toLowerCase().includes(searchQuery.toLowerCase()))
                    ).map((review) => (
                  <div key={review.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex gap-8 items-center group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 shadow-inner border-2 border-white ring-8 ring-gray-50/50">
                      {review.img && <img src={review.img} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex text-yellow-400 gap-0.5 mb-2 drop-shadow-sm">{'★'.repeat(review.rating || 5)}</div>
                      <h3 className="text-primary font-bold text-xl mb-1">{review.name}</h3>
                      <p className="text-gray-400 text-sm truncate font-medium">{review.headline || review.text}</p>
                      <p className="text-luxury text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Exp: {review.date}</p>
                    </div>
                    <div className="flex gap-3 flex-shrink-0 pr-4">
                      <button onClick={() => handleEditReview(review)} className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-primary hover:text-white text-gray-400 rounded-2xl transition-all duration-300">✏️</button>
                      <button onClick={() => handleDeleteReview(review.id)} className="w-12 h-12 flex items-center justify-center bg-red-50 hover:bg-red-500 hover:text-white text-red-400 rounded-2xl transition-all duration-300">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ITINERARIES LIST */}
          {activeTab === 'itineraries' && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 px-4 gap-4">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-primary mb-1">Luxury Itineraries</h3>
                  <p className="text-gray-400 text-sm font-medium">Design and organize premium tour packages</p>
                </div>
                <div className="flex flex-1 w-full md:w-auto max-w-md gap-4">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input 
                      type="text" 
                      placeholder="Search itineraries..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-6 outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm font-medium shadow-sm"
                    />
                  </div>
                  <button onClick={() => { resetItineraryForm(); setActiveTab('new-itinerary'); }} className="bg-primary text-white font-bold px-8 py-3 rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 text-sm tracking-wide whitespace-nowrap">+ NEW ITINERARY</button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {contentLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Loading itineraries...</p>
                  </div>
                ) : publishedItineraries.filter(itinerary => 
                    itinerary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    itinerary.category.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 ? (
                  <div className="bg-white rounded-[40px] p-24 text-center border border-gray-100 shadow-sm">
                    <div className="text-6xl mb-6">{searchQuery ? '🔎' : '🗺️'}</div>
                    <h4 className="text-xl font-bold text-primary mb-2">{searchQuery ? 'No matching itineraries' : 'No itineraries yet'}</h4>
                    <p className="text-gray-400 max-w-xs mx-auto mb-8">
                      {searchQuery ? `We couldn't find any itineraries matching "${searchQuery}"` : 'Build beautiful travel routes for your clients.'}
                    </p>
                    {searchQuery ? (
                      <button onClick={() => setSearchQuery('')} className="text-primary font-bold hover:underline">Clear search filter</button>
                    ) : (
                      <button onClick={() => setActiveTab('new-itinerary')} className="text-primary font-bold hover:underline">Plan your first trip →</button>
                    )}
                  </div>
                ) : publishedItineraries
                    .filter(itinerary => 
                      itinerary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      itinerary.category.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((itinerary) => (
                  <div key={itinerary.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex gap-8 items-center group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="w-32 h-24 rounded-3xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-inner relative">
                      {itinerary.image && <img src={itinerary.image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                      <div className="absolute top-2 left-2 bg-primary/80 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">{itinerary.duration}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-bold text-luxury bg-luxury/10 px-2 py-0.5 rounded-full uppercase tracking-widest">{itinerary.category}</span>
                        <span className="text-primary/40 font-bold text-[10px] uppercase tracking-widest">€ {itinerary.price} / PERS</span>
                      </div>
                      <h3 className="text-primary font-bold text-xl leading-tight truncate mb-1">{itinerary.title}</h3>
                      <p className="text-gray-400 text-sm truncate font-medium">{itinerary.description}</p>
                    </div>
                    <div className="flex gap-3 flex-shrink-0 pr-4">
                      <button onClick={() => handleEditItinerary(itinerary)} className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-primary hover:text-white text-gray-400 rounded-2xl transition-all duration-300">✏️</button>
                      <button onClick={() => handleDeleteItinerary(itinerary.id)} className="w-12 h-12 flex items-center justify-center bg-red-50 hover:bg-red-500 hover:text-white text-red-400 rounded-2xl transition-all duration-300">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INTERESTS / CATEGORIES LIST */}
          {activeTab === 'interests' && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-end mb-8 px-4">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-primary mb-1">Interest Categories</h3>
                  <p className="text-gray-400 text-sm font-medium">Manage interest groups and itineraries categories</p>
                </div>
                <button onClick={() => { resetCategoryForm(); setActiveTab('new-category'); }} className="bg-primary text-white font-bold px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 text-sm tracking-wide">+ NEW CATEGORY</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contentLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-4 col-span-full">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Loading categories...</p>
                  </div>
                ) : publishedCategories.length === 0 ? (
                  <div className="bg-white rounded-[40px] p-24 text-center border border-gray-100 shadow-sm col-span-full">
                    <div className="text-6xl mb-6">🎯</div>
                    <h4 className="text-xl font-bold text-primary mb-2">No categories yet</h4>
                    <p className="text-gray-400 max-w-xs mx-auto mb-8">Définissez des thématiques comme 'Aventure' ou 'Culture'.</p>
                    <button onClick={() => setActiveTab('new-category')} className="text-primary font-bold hover:underline">Create your first category →</button>
                  </div>
                ) : publishedCategories.map((cat) => (
                  <div key={cat.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex gap-6 items-center group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-inner">
                      {cat.image && <img src={cat.image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-primary font-bold text-lg mb-1">{cat.title}</h3>
                      <p className="text-luxury text-[10px] font-bold uppercase tracking-[0.2em]">Slug: {cat.slug}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleEditCategory(cat)} className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-primary hover:text-white text-gray-400 rounded-xl transition-all duration-300 text-sm">✏️</button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="w-10 h-10 flex items-center justify-center bg-red-50 hover:bg-red-500 hover:text-white text-red-400 rounded-xl transition-all duration-300 text-sm">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'hotels' && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 px-4 gap-4">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-primary mb-1">Luxury Hotels</h3>
                  <p className="text-gray-400 text-sm font-medium">Manage your hotel listings</p>
                </div>
                <div className="flex flex-1 w-full md:w-auto max-w-md gap-4">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input 
                      type="text" 
                      placeholder="Search hotels..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-6 outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm font-medium shadow-sm"
                    />
                  </div>
                  <button onClick={() => { resetHotelForm(); setActiveTab('new-hotel'); }} className="bg-primary text-white font-bold px-8 py-3 rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 text-sm tracking-wide whitespace-nowrap">+ NEW HOTEL</button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {contentLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Syncing with database...</p>
                  </div>
                ) : publishedHotels.filter(h => (h.name || '').toLowerCase().includes(searchQuery.toLowerCase())).map((h, i) => (
                  <div key={i} className="bg-white p-4 rounded-3xl flex items-center gap-6 shadow-sm border border-gray-50 hover:shadow-md transition-all group">
                    {h.image ? <img src={h.image} className="w-24 h-24 rounded-2xl object-cover" alt="" /> : <div className="w-24 h-24 rounded-2xl bg-gray-100"></div>}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-bold tracking-wider text-primary/60 bg-primary/5 px-2 py-1 rounded-full uppercase">{h.category}</span>
                        <span className="text-xs text-gray-400 font-medium">{h.stars} Stars</span>
                      </div>
                      <h4 className="font-serif text-lg font-bold text-primary mb-1">{h.name}</h4>
                      <p className="text-gray-400 text-sm font-medium">{h.location}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditHotel(h)} className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors">✏️</button>
                      <button onClick={() => handleDeleteHotel(h.id)} className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {activeTab === 'new-hotel' && (
            <div className="animate-slide-up">
              <div className="bg-white p-12 md:p-16 rounded-[48px] shadow-2xl border border-gray-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                
                <div className="flex items-center justify-between mb-12 relative z-10">
                  <div>
                    <h2 className="text-3xl font-serif font-bold text-primary mb-2">{editingHotelId ? 'Edit Hotel' : 'New Hotel'}</h2>
                    <p className="text-gray-400 font-medium">Manage hotel details and amenities</p>
                  </div>
                  <div className="flex gap-3">
                    {editingHotelId && (
                      <button type="button" onClick={() => { resetHotelForm(); setActiveTab('hotels'); }} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full font-medium transition-colors">
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleHotelSubmit} className="space-y-8 relative z-10">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-bold text-primary mb-2 uppercase tracking-wide">Hotel Name</label>
                      <input type="text" value={hotelForm.name} onChange={e=>setHotelForm({...hotelForm, name: e.target.value})} className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" required/>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-primary mb-2 uppercase tracking-wide">Location</label>
                      <input type="text" value={hotelForm.location} onChange={e=>setHotelForm({...hotelForm, location: e.target.value})} className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" required/>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-primary mb-2 uppercase tracking-wide">Stars</label>
                      <input type="number" value={hotelForm.stars} onChange={e=>setHotelForm({...hotelForm, stars: e.target.value})} className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" required/>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-primary mb-2 uppercase tracking-wide">Category</label>
                      <select value={hotelForm.category} onChange={e=>setHotelForm({...hotelForm, category: e.target.value})} className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-600">
                        <option value="">Select Category</option>
                        <option value="standard">Standard</option>
                        <option value="superior">Superior</option>
                        <option value="luxury">Luxury</option>
                        <option value="super-luxury">Super luxury</option>
                        <option value="east-south-coast">Eastcoast & South coast</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-primary mb-2 uppercase tracking-wide">Description</label>
                    <textarea value={hotelForm.description} onChange={e=>setHotelForm({...hotelForm, description: e.target.value})} className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium h-32" required></textarea>
                  </div>
                  
                  <div className="pt-8 border-t border-gray-100">
                    <h3 className="text-xl font-serif font-bold text-primary mb-4">Amenities Builder</h3>
                    <div className="space-y-6">
                      {hotelForm.extendedAmenities.categories.map((cat, catIdx) => (
                        <div key={catIdx} className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                          <div className="flex justify-between items-center mb-6">
                            <div className="flex gap-4 flex-1">
                              <input type="text" placeholder="Category Title (e.g. Bathroom)" value={cat.title} onChange={e => {
                                const newCats = [...hotelForm.extendedAmenities.categories];
                                newCats[catIdx].title = e.target.value;
                                setHotelForm({...hotelForm, extendedAmenities: { ...hotelForm.extendedAmenities, categories: newCats }});
                              }} className="bg-white border-none p-3 rounded-xl flex-1 outline-none focus:ring-2 focus:ring-primary/20 font-medium" />
                              <input type="text" placeholder="Icon (e.g. 🛁)" value={cat.icon} onChange={e => {
                                const newCats = [...hotelForm.extendedAmenities.categories];
                                newCats[catIdx].icon = e.target.value;
                                setHotelForm({...hotelForm, extendedAmenities: { ...hotelForm.extendedAmenities, categories: newCats }});
                              }} className="bg-white border-none p-3 rounded-xl w-32 text-center outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <button type="button" onClick={() => {
                              const newCats = hotelForm.extendedAmenities.categories.filter((_, i) => i !== catIdx);
                              setHotelForm({...hotelForm, extendedAmenities: { ...hotelForm.extendedAmenities, categories: newCats }});
                            }} className="text-red-500 ml-4 p-2 hover:bg-red-50 rounded-xl transition-colors">🗑️ Remove</button>
                          </div>
                          
                          <div className="pl-6 border-l-2 border-primary/20 space-y-3">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category Items</label>
                            <textarea 
                              value={(cat.items || []).join('\n')}
                              onChange={e => {
                                const newCats = [...hotelForm.extendedAmenities.categories];
                                newCats[catIdx].items = e.target.value.split('\n');
                                setHotelForm({...hotelForm, extendedAmenities: { ...hotelForm.extendedAmenities, categories: newCats }});
                              }}
                              className="w-full bg-white border border-gray-100 p-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 font-medium min-h-[120px] resize-y shadow-sm placeholder:text-gray-300"
                              placeholder="Paste multiple items here...&#10;e.g.&#10;Bidet&#10;Towels&#10;Soap"
                            ></textarea>
                          </div>
                        </div>
                      ))}
                      
                      <button type="button" onClick={() => {
                        const newCats = [...(hotelForm.extendedAmenities.categories || [])];
                        newCats.push({ title: '', icon: '', items: [] });
                        setHotelForm({...hotelForm, extendedAmenities: { ...hotelForm.extendedAmenities, categories: newCats }});
                      }} className="w-full py-4 border-2 border-dashed border-primary/20 rounded-3xl text-primary font-bold hover:bg-primary/5 hover:border-primary/40 transition-all">+ ADD NEW AMENITY CATEGORY</button>
                    </div>
                  </div>

                  <ImageUploadField label="Main Image" value={hotelForm.image} onChange={(url)=>setHotelForm({...hotelForm, image: url})} folder="hotels" />
                  
                  <div className="pt-8 border-t border-gray-100">
                    <h3 className="text-xl font-serif font-bold text-primary mb-4">Photo Gallery</h3>
                    <div className="space-y-4">
                      {hotelForm.categorizedGallery.map((item, i) => (
                        <div key={i} className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <select value={item.type} onChange={e=>{
                            const newGal = [...hotelForm.categorizedGallery]; newGal[i].type = e.target.value; setHotelForm({...hotelForm, categorizedGallery: newGal});
                          }} className="bg-white border-none p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium">
                            <option value="All">All</option><option value="Bedroom">Bedroom</option><option value="Restaurant">Restaurant</option><option value="Panorama">Panorama</option>
                          </select>
                          <div className="flex-1">
                            <ImageUploadField value={item.url} onChange={(url)=>{
                              const newGal = [...hotelForm.categorizedGallery]; newGal[i].url = url; setHotelForm({...hotelForm, categorizedGallery: newGal});
                            }} folder="hotels/gallery" />
                          </div>
                          <button type="button" onClick={()=>{
                            const newGal = hotelForm.categorizedGallery.filter((_, idx)=>idx!=i); setHotelForm({...hotelForm, categorizedGallery: newGal});
                          }} className="w-12 h-12 rounded-xl bg-white shadow-sm text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors">🗑️</button>
                        </div>
                      ))}
                      <button type="button" onClick={()=>setHotelForm({...hotelForm, categorizedGallery: [...hotelForm.categorizedGallery, {type: 'All', url: ''}]})} className="text-primary font-bold text-sm bg-primary/5 px-6 py-3 rounded-xl hover:bg-primary/10 transition-colors inline-block">+ Add single photo</button>
                      
                      <div className="mt-8 pt-8 border-t border-gray-100">
                        <MultiImageUploadButton folder="hotels/gallery" onUploadComplete={(urls, cat) => {
                          const newEntries = urls.map(u => ({ type: cat, url: u }));
                          setHotelForm({...hotelForm, categorizedGallery: [...hotelForm.categorizedGallery, ...newEntries]});
                        }} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-8 text-right">
                    <button type="submit" disabled={loading} className="bg-primary text-white px-12 py-4 rounded-full font-bold shadow-xl shadow-primary/20 hover:-translate-y-1 hover:shadow-2xl transition-all">
                      {loading ? 'Publishing...' : editingHotelId ? 'UPDATE HOTEL' : 'PUBLISH HOTEL'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* NEW / EDIT ARTICLE FORM */}
          {activeTab === 'new-article' && (
            <div className="animate-slide-up">
              <div className="bg-white p-12 md:p-16 rounded-[48px] shadow-2xl border border-gray-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                
                <div className="flex items-center justify-between mb-12 relative z-10">
                  <div>
                    <h2 className="text-3xl font-serif font-bold text-primary mb-2">{editingArticleId ? 'Edit Article' : 'New Article'}</h2>
                    <p className="text-gray-400 font-medium">Create captivating travel guides</p>
                  </div>
                  <div className="flex gap-3">
                    
          <button type="button" onClick={handleEnglishToBothArticle} disabled={isTranslating || loading} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors flex items-center justify-center min-w-[200px] shadow-md hover:shadow-lg">
            {isTranslating ? '🌐 Traduction...' : '🌐 Publier depuis l\'Anglais'}
          </button>
          
                    {editingArticleId && (
                      <button type="button" onClick={resetArticleForm} className="bg-gray-50 text-gray-400 hover:text-red-500 w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0">✕</button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleArticleSubmit} className="space-y-10 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className={labelClass}>Main Title</label>
                      <input type="text" required value={articleForm.title} onChange={(e) => setArticleForm({...articleForm, title: e.target.value})} className={inputClass} placeholder="The Golden Triangle..." />
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>Category</label>
                      <select value={articleForm.category} onChange={(e) => setArticleForm({...articleForm, category: e.target.value})} className={inputClass}>
                        <option value="History">History</option>
                        <option value="Nature">Nature</option>
                        <option value="Culture">Culture</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Luxury">Luxury</option>
                        <option value="Honeymoon">Honeymoon</option>
                        <option value="Family">Family</option>
                        <option value="Golf">Golf</option>
                        <option value="Surf">Surf</option>
                        <option value="Discovery">Discovery</option>
                        <option value="Waterfalls">Waterfalls</option>
                        <option value="Beach">Beach</option>
                        <option value="Islands">Islands</option>
                        <option value="Popular">Popular</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Hero Description</label>
                    <input type="text" required value={articleForm.description} onChange={(e) => setArticleForm({...articleForm, description: e.target.value})} className={inputClass} placeholder="A deep dive into..." />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ImageUploadField 
                      label="Cover Image" 
                      value={articleForm.image} 
                      onChange={(url) => setArticleForm({...articleForm, image: url})} 
                      folder="articles"
                    />
                    <div className="space-y-2">
                      <label className={labelClass}>Short Card Excerpt</label>
                      <input type="text" required value={articleForm.excerpt} onChange={(e) => setArticleForm({...articleForm, excerpt: e.target.value})} className={inputClass} placeholder="Preview snippet..." />
                    </div>
                  </div>

                  <div className="pt-10 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-serif font-bold text-primary">Content Architect</h3>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => addBlock('paragraph')} className="bg-gray-50 hover:bg-primary hover:text-white text-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all">+ Para</button>
                        <button type="button" onClick={() => addBlock('heading')} className="bg-gray-50 hover:bg-primary hover:text-white text-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all">+ Head</button>
                        <button type="button" onClick={() => addBlock('quote')} className="bg-gray-50 hover:bg-primary hover:text-white text-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all">+ Quote</button>
                        <button type="button" onClick={() => addBlock('image')} className="bg-gray-50 hover:bg-primary hover:text-white text-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all">+ Image</button>
                        <button type="button" onClick={() => addBlock('tips')} className="bg-gray-50 hover:bg-primary hover:text-white text-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all">+ Tips</button>
                        <button type="button" onClick={() => addBlock('list')} className="bg-gray-50 hover:bg-primary hover:text-white text-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all">+ List</button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {contentBlocks.map((block, index) => (
                        <div key={index} className="bg-gray-50/50 p-8 rounded-[32px] relative group border border-gray-100 hover:border-primary/20 transition-colors">
                          <button type="button" onClick={() => removeBlock(index)} className="absolute -top-3 -right-3 w-8 h-8 bg-white text-red-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center font-bold">✕</button>
                          
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${block.type === 'heading' ? 'bg-primary' : block.type === 'quote' ? 'bg-luxury' : block.type === 'image' ? 'bg-green-500' : block.type === 'tips' ? 'bg-orange-400' : block.type === 'list' ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{block.type}</span>
                            </div>

                            {/* Move Up / Down controls */}
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                type="button" 
                                disabled={index === 0}
                                onClick={() => moveBlock(index, 'up')}
                                className="w-7 h-7 bg-white hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-400 text-gray-500 rounded-lg shadow-sm border border-gray-100 flex items-center justify-center text-xs transition-colors"
                                title="Déplacer vers le haut"
                              >
                                ↑
                              </button>
                              <button 
                                type="button" 
                                disabled={index === contentBlocks.length - 1}
                                onClick={() => moveBlock(index, 'down')}
                                className="w-7 h-7 bg-white hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-400 text-gray-500 rounded-lg shadow-sm border border-gray-100 flex items-center justify-center text-xs transition-colors"
                                title="Déplacer vers le bas"
                              >
                                ↓
                              </button>
                            </div>
                          </div>

                          {block.type === 'image' ? (
                            <ImageUploadField 
                              label="Block Image" 
                              value={block.text} 
                              onChange={(url) => updateBlock(index, url)} 
                              folder="articles/content"
                            />
                          ) : (
                            <textarea 
                              rows={block.type === 'paragraph' ? 4 : 2} 
                              value={block.text} 
                              onChange={(e) => updateBlock(index, e.target.value)} 
                              placeholder={`Enter your ${block.type} here...`} 
                              className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 outline-none resize-none focus:ring-4 focus:ring-primary/5 transition-all font-medium text-primary"
                            ></textarea>
                          )}

                          {/* Inline Insert Buttons */}
                          <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Insérer après ce bloc :</span>
                            <div className="flex flex-wrap gap-1.5">
                              <button type="button" onClick={() => addBlock('paragraph', index)} className="bg-white hover:bg-primary hover:text-white border border-gray-200 text-primary text-[8px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all">+ Para</button>
                              <button type="button" onClick={() => addBlock('heading', index)} className="bg-white hover:bg-primary hover:text-white border border-gray-200 text-primary text-[8px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all">+ Head</button>
                              <button type="button" onClick={() => addBlock('quote', index)} className="bg-white hover:bg-primary hover:text-white border border-gray-200 text-primary text-[8px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all">+ Quote</button>
                              <button type="button" onClick={() => addBlock('image', index)} className="bg-white hover:bg-primary hover:text-white border border-gray-200 text-primary text-[8px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all">+ Image</button>
                              <button type="button" onClick={() => addBlock('tips', index)} className="bg-white hover:bg-primary hover:text-white border border-gray-200 text-primary text-[8px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all">+ Tips</button>
                              <button type="button" onClick={() => addBlock('list', index)} className="bg-white hover:bg-primary hover:text-white border border-gray-200 text-primary text-[8px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all">+ List</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SEO Settings Section */}
                  <div className="pt-10 border-t border-gray-100 mt-12">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-luxury/10 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-luxury" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-serif font-bold text-primary">SEO Architecture</h3>
                        <p className="text-gray-400 text-xs font-medium">Optimize visibility for search engines</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={autoGenerateArticleSEO}
                        className="ml-auto bg-luxury/10 hover:bg-luxury hover:text-white text-luxury text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Auto-Generate
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className={labelClass}>Meta Title (Recommended 50-60 chars)</label>
                        <input 
                          type="text" 
                          value={articleForm.seo_title} 
                          onChange={(e) => setArticleForm({...articleForm, seo_title: e.target.value})} 
                          className={inputClass} 
                          placeholder="Luxury Sri Lanka Tours | Eden Travels"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Meta Description (Recommended 150-160 chars)</label>
                        <textarea 
                          rows="3" 
                          value={articleForm.seo_description} 
                          onChange={(e) => setArticleForm({...articleForm, seo_description: e.target.value})} 
                          className={`${inputClass} resize-none`} 
                          placeholder="Discover the ultimate luxury travel experience in Sri Lanka..."
                        ></textarea>
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Meta Keywords (Comma separated)</label>
                        <input 
                          type="text" 
                          value={articleForm.seo_keywords} 
                          onChange={(e) => setArticleForm({...articleForm, seo_keywords: e.target.value})} 
                          className={inputClass} 
                          placeholder="sri lanka luxury tours, safari, tea plantations"
                        />
                      </div>
                    </div>
                  </div>

                  <button disabled={loading} className="w-full bg-primary text-white font-bold py-6 rounded-[24px] shadow-2xl shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-12 text-sm tracking-[0.2em]">
                    {loading ? 'PROCESSING...' : editingArticleId ? 'SAVE CHANGES' : 'PUBLISH GUIDE'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* NEW / EDIT REVIEW FORM */}
          {activeTab === 'new-review' && (
            <div className="animate-slide-up">
              <div className="bg-white p-12 md:p-16 rounded-[48px] shadow-2xl border border-gray-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                
                <div className="flex items-center justify-between mb-12 relative z-10">
                  <div>
                    <h2 className="text-3xl font-serif font-bold text-primary mb-2">{editingReviewId ? 'Edit Experience' : 'Share Experience'}</h2>
                    <p className="text-gray-400 font-medium">Turn feedback into a luxury story</p>
                  </div>
                  <div className="flex gap-3">
                    
          <button type="button" onClick={handleEnglishToBothReview} disabled={isTranslating || loading} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors flex items-center justify-center min-w-[200px] shadow-md hover:shadow-lg">
            {isTranslating ? '🌐 Traduction...' : '🌐 Publier depuis l\'Anglais'}
          </button>
          
                    {editingReviewId && (
                      <button type="button" onClick={resetReviewForm} className="bg-gray-50 text-gray-400 hover:text-red-500 w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0">✕</button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-12 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className={labelClass}>Traveler Name</label>
                      <input type="text" required value={reviewForm.name} onChange={(e) => setReviewForm({...reviewForm, name: e.target.value})} className={inputClass} placeholder="Sophie & Marc" />
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>Tour Display Date</label>
                      <input type="text" required value={reviewForm.date} onChange={(e) => setReviewForm({...reviewForm, date: e.target.value})} className={inputClass} placeholder="February 2024" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ImageUploadField 
                      label="Main Hero Photo" 
                      value={reviewForm.img} 
                      onChange={(url) => setReviewForm({...reviewForm, img: url})} 
                      folder="reviews"
                    />
                    <div className="space-y-2">
                      <label className={labelClass}>Italicized Headline</label>
                      <input type="text" value={reviewForm.headline} onChange={(e) => setReviewForm({...reviewForm, headline: e.target.value})} className={inputClass} placeholder="An unforgettable journey..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Short Preview Snippet</label>
                    <input type="text" required value={reviewForm.text} onChange={(e) => setReviewForm({...reviewForm, text: e.target.value})} className={inputClass} />
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Detailed Experience Story</label>
                    <textarea rows="10" required value={reviewForm.detailedtext} onChange={(e) => setReviewForm({...reviewForm, detailedtext: e.target.value})} className={`${inputClass} resize-none shadow-inner`} placeholder="Describe the luxury experience in detail..."></textarea>
                  </div>

                  <div className="pt-10 border-t border-gray-100">
                    <h3 className="text-xl font-serif font-bold text-primary mb-8 text-center">Visual Gallery</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {reviewForm.gallery.map((url, i) => (
                        <ImageUploadField 
                          key={i}
                          label={`Photo ${i+1}`}
                          value={url}
                          onChange={(newUrl) => {
                            const newGallery = [...reviewForm.gallery];
                            newGallery[i] = newUrl;
                            setReviewForm({...reviewForm, gallery: newGallery});
                          }}
                          folder="reviews/gallery"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-gray-100">
                    <div className="bg-gray-50/50 p-8 rounded-[40px]">
                      <h3 className="text-lg font-serif font-bold text-primary mb-6 flex items-center gap-3">📊 Tour Stats</h3>
                      <div className="space-y-4">
                        <input type="text" placeholder="Tour Date" value={reviewForm.tourdetails.date} onChange={(e) => setReviewForm({...reviewForm, tourdetails: {...reviewForm.tourdetails, date: e.target.value}})} className={inputClass} />
                        <input type="text" placeholder="Traveler Type" value={reviewForm.tourdetails.travelertype} onChange={(e) => setReviewForm({...reviewForm, tourdetails: {...reviewForm.tourdetails, travelertype: e.target.value}})} className={inputClass} />
                        <input type="text" placeholder="Group Type" value={reviewForm.tourdetails.group} onChange={(e) => setReviewForm({...reviewForm, tourdetails: {...reviewForm.tourdetails, group: e.target.value}})} className={inputClass} />
                      </div>
                    </div>
                    <div className="bg-gray-50/50 p-8 rounded-[40px]">
                      <h3 className="text-lg font-serif font-bold text-primary mb-6 flex items-center gap-3">👤 Guide Info</h3>
                      <div className="space-y-4">
                        <input type="text" placeholder="Guide Name" value={reviewForm.guide.name} onChange={(e) => setReviewForm({...reviewForm, guide: {...reviewForm.guide, name: e.target.value}})} className={inputClass} />
                        <ImageUploadField 
                          label="Guide Photo" 
                          value={reviewForm.guide.photo} 
                          onChange={(url) => setReviewForm({...reviewForm, guide: {...reviewForm.guide, photo: url}})} 
                          folder="guides"
                        />
                        <textarea placeholder="Personal Quote" value={reviewForm.guide.quote} onChange={(e) => setReviewForm({...reviewForm, guide: {...reviewForm.guide, quote: e.target.value}})} className={`${inputClass} h-24 resize-none`}></textarea>
                      </div>
                    </div>
                  </div>

                  <button disabled={loading} className="w-full bg-primary text-white font-bold py-6 rounded-[24px] shadow-2xl shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-12 text-sm tracking-[0.2em]">
                    {loading ? 'STORING...' : editingReviewId ? 'UPDATE STORY' : 'POST EXPERIENCE'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* NEW / EDIT ITINERARY FORM */}
          {activeTab === 'new-itinerary' && (
            <div className="animate-slide-up">
              <div className="bg-white p-12 md:p-16 rounded-[48px] shadow-2xl border border-gray-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                
                <div className="flex items-center justify-between mb-12 relative z-10">
                  <div>
                    <h2 className="text-3xl font-serif font-bold text-primary mb-2">{editingItineraryId ? 'Fine-tune Journey' : 'Draft New Journey'}</h2>
                    <p className="text-gray-400 font-medium">Design the ultimate luxury itinerary</p>
                  </div>
                  <div className="flex gap-3">
                    
          <button type="button" onClick={handleEnglishToBothItinerary} disabled={isTranslating || loading} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors flex items-center justify-center min-w-[200px] shadow-md hover:shadow-lg">
            {isTranslating ? '🌐 Traduction...' : '🌐 Publier depuis l\'Anglais'}
          </button>
          
                    {editingItineraryId && (
                      <button type="button" onClick={resetItineraryForm} className="bg-gray-50 text-gray-400 hover:text-red-500 w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0">✕</button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleItinerarySubmit} className="space-y-12 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className={labelClass}>Tour Title</label>
                      <input type="text" required value={itineraryForm.title} onChange={(e) => setItineraryForm({...itineraryForm, title: e.target.value})} className={inputClass} placeholder="Ceylon Royal Heritage..." />
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>Category</label>
                      <select value={itineraryForm.category} onChange={(e) => setItineraryForm({...itineraryForm, category: e.target.value})} className={inputClass}>
                        <option value="Popular">Popular</option>
                        <option value="Honeymoon">Honeymoon</option>
                        <option value="Family">Family</option>
                        <option value="Luxury">Luxury</option>
                        <option value="Golf">Golf</option>
                        <option value="Surf">Surf</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Perahera">Perahera</option>
                        <option value="8days">8 Days</option>
                        <option value="Interests">Interests</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Package Overview</label>
                    <textarea rows="4" required value={itineraryForm.description} onChange={(e) => setItineraryForm({...itineraryForm, description: e.target.value})} className={`${inputClass} resize-none shadow-inner`}></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ImageUploadField 
                      label="Main Hero Visual" 
                      value={itineraryForm.image} 
                      onChange={(url) => setItineraryForm({...itineraryForm, image: url})} 
                      folder="itineraries"
                    />
                    <div className="space-y-2">
                      <label className={labelClass}>Price Base (€)</label>
                      <input type="text" required value={itineraryForm.price} onChange={(e) => setItineraryForm({...itineraryForm, price: e.target.value})} className={inputClass} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>Tour Features (Icons - comma separated)</label>
                    <input type="text" value={itineraryForm.icons} onChange={(e) => setItineraryForm({...itineraryForm, icons: e.target.value})} className={inputClass} placeholder="5 Star, Half Board, Private Car" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className={labelClass}>Duration Display</label>
                      <input type="text" required value={itineraryForm.duration} onChange={(e) => setItineraryForm({...itineraryForm, duration: e.target.value})} className={inputClass} placeholder="12 Days" />
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>Group Type</label>
                      <input type="text" value={itineraryForm.group} onChange={(e) => setItineraryForm({...itineraryForm, group: e.target.value})} className={inputClass} placeholder="Private" />
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>Effort Level</label>
                      <input type="text" value={itineraryForm.effort} onChange={(e) => setItineraryForm({...itineraryForm, effort: e.target.value})} className={inputClass} placeholder="Moderate" />
                    </div>
                  </div>

                  <div className="pt-10 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-12">
                      <h3 className="text-2xl font-serif font-bold text-primary">Day-by-Day Architect</h3>
                      <button type="button" onClick={() => setItineraryDays([...itineraryDays, { id: itineraryDays.length + 1, location: '', image: '', description: '', highlights: '', accommodation: '', accommodationImages: ['', '', '', ''], meals: 'Breakfast & Dinner', travel: '', coords: { x: 150, y: 225 } }])} className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-[18px] shadow-lg shadow-primary/10 hover:scale-105 active:scale-95 transition-all">+ Add New Day</button>
                    </div>
                    
                    <div className="space-y-20">
                      {itineraryDays.map((day, idx) => (
                        <div key={idx} className="bg-white p-10 rounded-[48px] relative group border-2 border-gray-50 shadow-xl hover:border-primary/10 transition-all duration-500">
                          <div className="absolute -left-5 top-10 w-14 h-14 bg-primary text-white rounded-[24px] flex items-center justify-center font-bold shadow-2xl shadow-primary/20 rotate-[-10deg] group-hover:rotate-0 transition-transform">{day.displayLabel || `D${day.id}`}</div>
                          <div className="absolute top-10 right-10">
                            <button type="button" onClick={() => setItineraryDays(itineraryDays.filter((_, i) => i !== idx))} className="text-red-300 hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-colors">Delete Day</button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-6">
                            <div className="space-y-2">
                              <label className={labelClass}>Custom Day Label (Optional)</label>
                              <input 
                                type="text" 
                                value={day.displayLabel || ''} 
                                onChange={e => {
                                  const newDays = [...itineraryDays];
                                  newDays[idx].displayLabel = e.target.value;
                                  setItineraryDays(newDays);
                                }} 
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium text-primary shadow-inner" 
                                placeholder="e.g. Jour 02 - 05"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className={labelClass}>Destination</label>
                              <input type="text" required value={day.location} onChange={e => {
                                const newDays = [...itineraryDays];
                                newDays[idx].location = e.target.value;
                                setItineraryDays(newDays);
                              }} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium text-primary shadow-inner" />
                            </div>
                            <ImageUploadField 
                              label="Day Visual" 
                              value={day.image} 
                              onChange={(url) => {
                                const newDays = [...itineraryDays];
                                newDays[idx].image = url;
                                setItineraryDays(newDays);
                              }} 
                              folder="itineraries/days"
                            />
                          </div>

                          <div className="space-y-2 mt-8">
                            <label className={labelClass}>Day's Narrative</label>
                            <textarea rows="4" required value={day.description} onChange={e => {
                              const newDays = [...itineraryDays];
                              newDays[idx].description = e.target.value;
                              setItineraryDays(newDays);
                            }} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium text-primary shadow-inner resize-none"></textarea>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-8">
                            <div className="space-y-2">
                              <label className={labelClass}>Key Highlights</label>
                              <input type="text" value={day.highlights} onChange={e => {
                                const value = e.target.value;
                                const newDays = [...itineraryDays];
                                newDays[idx].highlights = value;
                                
                                const lowerValue = value.toLowerCase();
                                for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
                                  if (lowerValue.includes(city)) {
                                    newDays[idx].coords = { x: coords.x, y: coords.y };
                                    break;
                                  }
                                }
                                
                                setItineraryDays(newDays);
                              }} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium text-primary shadow-inner" placeholder="Temple, Jungle, Tea..." />
                            </div>
                            <div className="space-y-2">
                              <label className={labelClass}>Accommodation</label>
                              <input type="text" value={day.accommodation} onChange={e => {
                                const newDays = [...itineraryDays];
                                newDays[idx].accommodation = e.target.value;
                                setItineraryDays(newDays);
                              }} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium text-primary shadow-inner" />
                            </div>
                          </div>

                          <div className="space-y-2 mt-8">
                            <label className={labelClass}>Accommodation Gallery (4 Images)</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {[0, 1, 2, 3].map((imgIdx) => (
                                <ImageUploadField 
                                  key={imgIdx}
                                  label={`Image ${imgIdx + 1}`} 
                                  value={day.accommodationImages?.[imgIdx] || ''} 
                                  onChange={(url) => {
                                    const newDays = [...itineraryDays];
                                    if (!newDays[idx].accommodationImages) newDays[idx].accommodationImages = ['', '', '', ''];
                                    newDays[idx].accommodationImages[imgIdx] = url;
                                    setItineraryDays(newDays);
                                  }} 
                                  folder="itineraries/hotels"
                                />
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <div className="space-y-2">
                              <label className={labelClass}>Meals</label>
                              <input type="text" value={day.meals} onChange={e => {
                                const newDays = [...itineraryDays];
                                newDays[idx].meals = e.target.value;
                                setItineraryDays(newDays);
                              }} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3 px-5 outline-none focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium shadow-inner" />
                            </div>
                            <div className="space-y-2">
                              <label className={labelClass}>Travel Log</label>
                              <input type="text" value={day.travel} onChange={e => {
                                const newDays = [...itineraryDays];
                                newDays[idx].travel = e.target.value;
                                setItineraryDays(newDays);
                              }} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3 px-5 outline-none focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium shadow-inner" />
                            </div>
                            <MapCoordinatePicker 
                              x={day.coords.x} 
                              y={day.coords.y} 
                              dayNumber={day.id}
                              onChange={(x, y) => {
                                const newDays = [...itineraryDays];
                                newDays[idx].coords = { x, y };
                                setItineraryDays(newDays);
                              }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SEO Settings Section */}
                  <div className="pt-10 border-t border-gray-100 mt-16">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-luxury/10 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-luxury" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-serif font-bold text-primary">SEO Architecture</h3>
                        <p className="text-gray-400 text-xs font-medium">Optimize visibility for search engines</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={autoGenerateItinerarySEO}
                        className="ml-auto bg-luxury/10 hover:bg-luxury hover:text-white text-luxury text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Auto-Generate
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className={labelClass}>Meta Title (Recommended 50-60 chars)</label>
                        <input 
                          type="text" 
                          value={itineraryForm.seo_title} 
                          onChange={(e) => setItineraryForm({...itineraryForm, seo_title: e.target.value})} 
                          className={inputClass} 
                          placeholder="Luxury Sri Lanka Tours | Eden Travels"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Meta Description (Recommended 150-160 chars)</label>
                        <textarea 
                          rows="3" 
                          value={itineraryForm.seo_description} 
                          onChange={(e) => setItineraryForm({...itineraryForm, seo_description: e.target.value})} 
                          className={`${inputClass} resize-none`} 
                          placeholder="Discover the ultimate luxury travel experience in Sri Lanka..."
                        ></textarea>
                      </div>
                      <div className="space-y-2">
                        <label className={labelClass}>Meta Keywords (Comma separated)</label>
                        <input 
                          type="text" 
                          value={itineraryForm.seo_keywords} 
                          onChange={(e) => setItineraryForm({...itineraryForm, seo_keywords: e.target.value})} 
                          className={inputClass} 
                          placeholder="sri lanka luxury tours, safari, tea plantations"
                        />
                      </div>
                    </div>
                  </div>

                  <button disabled={loading} className="w-full bg-primary text-white font-bold py-6 rounded-[24px] shadow-2xl shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-16 text-sm tracking-[0.2em]">
                    {loading ? 'ARCHITECTING...' : editingItineraryId ? 'UPDATE JOURNEY' : 'CONSTRUCT JOURNEY'}
                  </button>
                </form>
              </div>
            </div>
          )}
          {/* NEW / EDIT CATEGORY FORM */}
          {activeTab === 'new-category' && (
            <div className="animate-slide-up">
              <div className="bg-white p-12 md:p-16 rounded-[48px] shadow-2xl border border-gray-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                
                <div className="flex items-center justify-between mb-12 relative z-10">
                  <div>
                    <h2 className="text-3xl font-serif font-bold text-primary mb-2">{editingCategoryId ? 'Modify Interest' : 'New Interest Group'}</h2>
                    <p className="text-gray-400 font-medium">Catégorisez les itinéraires par thématiques de voyage</p>
                  </div>
                  {editingCategoryId && (
                    <button type="button" onClick={resetCategoryForm} className="bg-gray-50 text-gray-400 hover:text-red-500 w-10 h-10 rounded-full flex items-center justify-center transition-colors">✕</button>
                  )}
                </div>

                <form onSubmit={handleCategorySubmit} className="space-y-10 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className={labelClass}>Category Title</label>
                      <input type="text" required value={categoryForm.title} onChange={(e) => setCategoryForm({...categoryForm, title: e.target.value})} className={inputClass} placeholder="Voyages de noces..." />
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>URL Slug / ID</label>
                      <input type="text" required value={categoryForm.slug} onChange={(e) => setCategoryForm({...categoryForm, slug: e.target.value})} className={inputClass} placeholder="honeymoon" />
                    </div>
                  </div>

                  <ImageUploadField 
                    label="Category Thumbnail" 
                    value={categoryForm.image} 
                    onChange={(url) => setCategoryForm({...categoryForm, image: url})} 
                    folder="categories"
                  />

                  <button disabled={loading} className="w-full bg-primary text-white font-bold py-6 rounded-[24px] shadow-2xl shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-12 text-sm tracking-[0.2em]">
                    {loading ? 'SAVING...' : editingCategoryId ? 'SAVE CATEGORY' : 'CREATE CATEGORY'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};

export default Admin;
