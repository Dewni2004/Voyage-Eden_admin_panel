import React, { useState, useEffect } from 'react';
import { 
  addReview, addArticle, getReviews, getArticles, updateArticle, deleteArticle, updateReview, deleteReview,
  getItineraries, addItinerary, updateItinerary, deleteItinerary,
  getCategories, addCategory, updateCategory, deleteCategory
} from '../services/contentService';
import ImageUploadField from '../components/Admin/ImageUploadField';
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
    const [articles, reviews, itineraries, categories] = await Promise.all([
      getArticles(), 
      getReviews(), 
      getItineraries(),
      getCategories()
    ]);
    setPublishedArticles(articles);
    setPublishedReviews(reviews);
    setPublishedItineraries(itineraries);
    setPublishedCategories(categories);
    setContentLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) fetchContent();
  }, [isAuthenticated]);

  const translateText = async (text, sl = 'fr', tl = 'de') => {
    if (!text || typeof text !== 'string') return text;
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      return data[0].map(item => item[0]).join('');
    } catch (e) {
      console.error("Translation error", e);
      return text;
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
        icons: itineraryForm.icons.split(',').map(i => i.trim()).filter(i => i !== '')
      };
      
      let newFrId = editingItineraryId;
      if (editingItineraryId) {
        await updateItinerary(editingItineraryId, frData);
      } else {
        newFrId = await addItinerary(frData);
      }

      const deData = { ...frData, id: newFrId };
      deData.title = await translateText(frData.title);
      deData.description = await translateText(frData.description);
      deData.effort = await translateText(frData.effort);
      deData.group = await translateText(frData.group);
      deData.seo_title = await translateText(frData.seo_title);
      deData.seo_description = await translateText(frData.seo_description);
      deData.seo_keywords = await translateText(frData.seo_keywords);

      deData.days = await Promise.all(frData.days.map(async (day) => {
        return {
          ...day,
          location: await translateText(day.location),
          description: await translateText(day.description),
          highlights: await translateText(day.highlights),
          accommodation: await translateText(day.accommodation),
          meals: await translateText(day.meals),
          travel: await translateText(day.travel),
          displayLabel: await translateText(day.displayLabel)
        };
      }));

      const { error: err } = await supabase.from('itineraries_de').upsert(deData);
      if (err) throw err;

      setMessage({ type: 'success', text: 'Itinéraire publié en FR et traduit/publié en DE !' });
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
      // 1. Translate EN to FR and save to FR Database
      const frData = { ...articleForm };
      frData.title = await translateText(articleForm.title, 'en', 'fr');
      frData.description = await translateText(articleForm.description, 'en', 'fr');
      frData.excerpt = await translateText(articleForm.excerpt, 'en', 'fr');
      frData.seo_title = await translateText(articleForm.seo_title, 'en', 'fr');
      frData.seo_description = await translateText(articleForm.seo_description, 'en', 'fr');
      frData.seo_keywords = await translateText(articleForm.seo_keywords, 'en', 'fr');
      
      frData.content = await Promise.all(contentBlocks.map(async (block) => {
        if (block.type !== 'image' && block.text) {
          return { ...block, text: await translateText(block.text, 'en', 'fr') };
        }
        return block;
      }));
      frData.content = frData.content.filter(b => b.text && b.text.trim() !== '');
      frData.tags = articleForm.category ? [`#${articleForm.category.replace(/\s+/g, '')}`] : [];

      let newFrId = editingArticleId;
      if (editingArticleId) {
        await updateArticle(editingArticleId, frData);
      } else {
        newFrId = await addArticle(frData);
      }

      // 2. Translate EN to DE and save to DE Database
      const deData = { ...frData, id: newFrId };
      deData.title = await translateText(articleForm.title, 'en', 'de');
      deData.description = await translateText(articleForm.description, 'en', 'de');
      deData.excerpt = await translateText(articleForm.excerpt, 'en', 'de');
      deData.seo_title = await translateText(articleForm.seo_title, 'en', 'de');
      deData.seo_description = await translateText(articleForm.seo_description, 'en', 'de');
      deData.seo_keywords = await translateText(articleForm.seo_keywords, 'en', 'de');
      
      deData.content = await Promise.all(contentBlocks.map(async (block) => {
        if (block.type !== 'image' && block.text) {
          return { ...block, text: await translateText(block.text, 'en', 'de') };
        }
        return block;
      }));

      const { error: err } = await supabase.from('articles_de').upsert(deData);
      if (err) throw err;

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
    if (!reviewForm.title) return;
    setLoading(true);
    setIsTranslating(true);
    setMessage({ type: '', text: '' });
    try {
      // 1. Translate EN to FR and save to FR Database
      const frForm = { ...reviewForm };
      frForm.title = await translateText(reviewForm.title, 'en', 'fr');
      frForm.review = await translateText(reviewForm.review, 'en', 'fr');
      frForm.excerpt = await translateText(reviewForm.excerpt, 'en', 'fr');
      frForm.tourdetails.type = await translateText(reviewForm.tourdetails.type, 'en', 'fr');
      frForm.tourdetails.duration = await translateText(reviewForm.tourdetails.duration, 'en', 'fr');
      frForm.tourdetails.group = await translateText(reviewForm.tourdetails.group, 'en', 'fr');
      frForm.guide.quote = await translateText(reviewForm.guide.quote, 'en', 'fr');

      let newFrId = editingReviewId;
      if (editingReviewId) {
        await updateReview(editingReviewId, frForm);
      } else {
        newFrId = await addReview(frForm);
      }

      // 2. Translate EN to DE and save to DE Database
      const deForm = { ...frForm, id: newFrId };
      deForm.title = await translateText(reviewForm.title, 'en', 'de');
      deForm.review = await translateText(reviewForm.review, 'en', 'de');
      deForm.excerpt = await translateText(reviewForm.excerpt, 'en', 'de');
      deForm.tourdetails.type = await translateText(reviewForm.tourdetails.type, 'en', 'de');
      deForm.tourdetails.duration = await translateText(reviewForm.tourdetails.duration, 'en', 'de');
      deForm.tourdetails.group = await translateText(reviewForm.tourdetails.group, 'en', 'de');
      deForm.guide.quote = await translateText(reviewForm.guide.quote, 'en', 'de');

      const { error: err } = await supabase.from('reviews_de').upsert(deForm);
      if (err) throw err;

      setMessage({ type: 'success', text: 'Avis publié en FR et DE depuis l\'Anglais !' });
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
    setMessage({ type: '', text: '' });
    try {
      // 1. Translate EN to FR and save to FR Database
      const frData = { 
        ...itineraryForm,
        icons: (itineraryForm.icons || '').split(',').map(i => i.trim()).filter(i => i !== '') 
      };
      frData.title = await translateText(itineraryForm.title, 'en', 'fr');
      frData.description = await translateText(itineraryForm.description, 'en', 'fr');
      frData.effort = await translateText(itineraryForm.effort, 'en', 'fr');
      frData.group = await translateText(itineraryForm.group, 'en', 'fr');
      frData.seo_title = await translateText(itineraryForm.seo_title, 'en', 'fr');
      frData.seo_description = await translateText(itineraryForm.seo_description, 'en', 'fr');
      frData.seo_keywords = await translateText(itineraryForm.seo_keywords, 'en', 'fr');
      frData.days = await Promise.all(itineraryDays.map(async (day) => {
        return {
          ...day,
          location: await translateText(day.location, 'en', 'fr'),
          description: await translateText(day.description, 'en', 'fr'),
          highlights: await translateText(day.highlights, 'en', 'fr'),
          accommodation: await translateText(day.accommodation, 'en', 'fr'),
          meals: await translateText(day.meals, 'en', 'fr'),
          travel: await translateText(day.travel, 'en', 'fr'),
          displayLabel: await translateText(day.displayLabel, 'en', 'fr')
        };
      }));

      let newFrId = editingItineraryId;
      if (editingItineraryId) {
        await updateItinerary(editingItineraryId, frData);
      } else {
        newFrId = await addItinerary(frData);
      }

      // 2. Translate EN to DE and save to DE Database
      const deData = { ...frData, id: newFrId };
      deData.title = await translateText(itineraryForm.title, 'en', 'de');
      deData.description = await translateText(itineraryForm.description, 'en', 'de');
      deData.effort = await translateText(itineraryForm.effort, 'en', 'de');
      deData.group = await translateText(itineraryForm.group, 'en', 'de');
      deData.seo_title = await translateText(itineraryForm.seo_title, 'en', 'de');
      deData.seo_description = await translateText(itineraryForm.seo_description, 'en', 'de');
      deData.seo_keywords = await translateText(itineraryForm.seo_keywords, 'en', 'de');
      deData.days = await Promise.all(itineraryDays.map(async (day) => {
        return {
          ...day,
          location: await translateText(day.location, 'en', 'de'),
          description: await translateText(day.description, 'en', 'de'),
          highlights: await translateText(day.highlights, 'en', 'de'),
          accommodation: await translateText(day.accommodation, 'en', 'de'),
          meals: await translateText(day.meals, 'en', 'de'),
          travel: await translateText(day.travel, 'en', 'de'),
          displayLabel: await translateText(day.displayLabel, 'en', 'de')
        };
      }));

      const { error: err } = await supabase.from('itineraries_de').upsert(deData);
      if (err) throw err;

      setMessage({ type: 'success', text: 'Itinéraire publié en FR et DE depuis l\'Anglais !' });
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

  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...articleForm,
        content: contentBlocks.filter(b => b.text.trim() !== ''),
        tags: articleForm.category ? [`#${articleForm.category.replace(/\s+/g, '')}`] : []
      };
      if (editingArticleId) {
        await updateArticle(editingArticleId, data);
        setMessage({ type: 'success', text: 'Article updated successfully!' });
      } else {
        await addArticle(data);
        setMessage({ type: 'success', text: 'Article published successfully!' });
      }
      resetArticleForm();
      fetchContent();
      setActiveTab('articles');
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Failed: ${error.message}` });
    }
    setLoading(false);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingReviewId) {
        await updateReview(editingReviewId, reviewForm);
        setMessage({ type: 'success', text: 'Review updated successfully!' });
      } else {
        await addReview(reviewForm);
        setMessage({ type: 'success', text: 'Review added successfully!' });
      }
      resetReviewForm();
      fetchContent();
      setActiveTab('reviews');
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Failed: ${error.message}` });
    }
    setLoading(false);
  };

  const handleItinerarySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { 
        ...itineraryForm, 
        days: itineraryDays,
        icons: itineraryForm.icons.split(',').map(i => i.trim()).filter(i => i !== '')
      };
      if (editingItineraryId) {
        await updateItinerary(editingItineraryId, data);
        setMessage({ type: 'success', text: 'Itinerary updated successfully!' });
      } else {
        await addItinerary(data);
        setMessage({ type: 'success', text: 'Itinerary published successfully!' });
      }
      resetItineraryForm();
      fetchContent();
      setActiveTab('itineraries');
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Failed: ${error.message}` });
    }
    setLoading(false);
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
