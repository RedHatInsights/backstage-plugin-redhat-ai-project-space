import { NavContentBlueprint } from '@backstage/plugin-app-react';
import { makeStyles } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import AccessAlarm from '@material-ui/icons/AccessAlarm';
import ExtensionIcon from '@material-ui/icons/Extension';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import FlashOn from '@material-ui/icons/FlashOn';
import {
  Settings as SidebarSettings,
  UserSettingsSignInAvatar,
} from '@backstage/plugin-user-settings';
import { SidebarSearchModal } from '@backstage/plugin-search';
import {
  Sidebar,
  sidebarConfig,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  Link,
  CatalogIcon,
} from '@backstage/core-components';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import LogoFull from '../../components/Root/LogoFull';
import LogoIcon from '../../components/Root/LogoIcon';
import { useSidebarOpenState } from '@backstage/core-components';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: sidebarConfig.drawerWidthClosed,
    height: 3 * sidebarConfig.logoHeight,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginBottom: -14,
  },
  link: {
    width: sidebarConfig.drawerWidthClosed,
    marginLeft: 24,
  },
});

const SidebarLogo = () => {
  const classes = useSidebarLogoStyles();
  const { isOpen } = useSidebarOpenState();

  return (
    <div className={classes.root}>
      <Link to="/" underline="none" className={classes.link} aria-label="Home">
        {isOpen ? <LogoFull /> : <LogoIcon />}
      </Link>
    </div>
  );
};

export const SidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ items }) => (
      <Sidebar>
        <SidebarLogo />
        <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
          <SidebarSearchModal />
        </SidebarGroup>
        <SidebarDivider />
        <SidebarGroup label="Menu" icon={<MenuIcon />}>
          <SidebarItem icon={HomeIcon} to="home" text="Home" />
          <SidebarItem icon={AccessAlarm} to="incident-response" text="Incident Response" />
          <SidebarItem icon={CatalogIcon} to="catalog" text="Catalog" />
          <SidebarItem icon={ExtensionIcon} to="changelog" text="App Interface" />
          <SidebarItem icon={LibraryBooks} to="news" text="News" />
          <SidebarItem icon={FlashOn} to="ai-showcase" text="AI Showcase" />
          <SidebarScrollWrapper>
            {items.map((item, index) => (
              <SidebarItem {...item} key={index} />
            ))}
          </SidebarScrollWrapper>
        </SidebarGroup>
        <SidebarDivider />
        <SidebarGroup
          label="Settings"
          icon={<UserSettingsSignInAvatar />}
          to="/settings"
        >
          <SidebarSettings />
        </SidebarGroup>
      </Sidebar>
    ),
  },
});
