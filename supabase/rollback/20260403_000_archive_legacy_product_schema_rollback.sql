alter table if exists legacy_product.feature_card_components set schema public;
alter table if exists legacy_product.feature_card_pages set schema public;
alter table if exists legacy_product.feature_card_userflows set schema public;
alter table if exists legacy_product.layout_components set schema public;
alter table if exists legacy_product.page_layouts set schema public;
alter table if exists legacy_product.userflow_pages set schema public;
alter table if exists legacy_product.components set schema public;
alter table if exists legacy_product.feature_cards set schema public;
alter table if exists legacy_product.pages set schema public;
alter table if exists legacy_product.project_members set schema public;
alter table if exists legacy_product.userflows set schema public;
alter table if exists legacy_product.projects set schema public;

drop table if exists legacy_product.migration_inventory;
drop schema if exists legacy_product;