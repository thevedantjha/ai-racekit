import { elements as dom } from './dom.js';

export function navigateTo(viewId) {
    dom.viewHome.classList.add('hidden');
    dom.viewDashboard.classList.add('hidden');
    
    if (viewId === 'view-home') {
        dom.viewHome.classList.remove('hidden');
    } else if (viewId === 'view-dashboard') {
        dom.viewDashboard.classList.remove('hidden');
    }
}

export function handleNavClick(e) {
    const targetId = e.currentTarget.dataset.target;
    navigateToDashboardView(targetId);
}

export function navigateToDashboardView(subViewId) {
    Object.values(dom.dashboardViews).forEach(view => view.classList.add('hidden'));

    if (dom.dashboardViews[subViewId.replace('view-','')]) {
        dom.dashboardViews[subViewId.replace('view-','')].classList.remove('hidden');
    }

    if (subViewId === 'view-evaluation') {
        dom.analysisSettings.classList.remove('hidden');
    } else {
        dom.analysisSettings.classList.add('hidden');
    }

    dom.navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.target === subViewId);
    });
}

